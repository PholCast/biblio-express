#!/usr/bin/env bash
set -euo pipefail

TRAFFIC_MODIFIED=false
ROLLING_BACK=false

stage_apply() {
  local canary_percent="$1"
  local faults="$2"
  local stable_percent=$((100 - canary_percent))

  if ! terraform apply -input=false -auto-approve \
      -var-file=terraform.tfvars \
      -var="stable_image=${STABLE_IMAGE}" \
      -var="canary_image=${CANARY_IMAGE}" \
      -var="stable_traffic_percent=${stable_percent}" \
      -var="canary_traffic_percent=${canary_percent}" \
      -var="canary_faults_enabled=${faults}"; then
    echo "Traffic update failed; attempting rollback."
    rollback
    return 3
  fi
  TRAFFIC_MODIFIED=true
}

rollback() {
  if [ "$ROLLING_BACK" = true ]; then
    return 1
  fi
  ROLLING_BACK=true
  echo "Rolling back Canary to 0% traffic."
  if terraform apply -input=false -auto-approve \
    -var-file=terraform.tfvars \
    -var="stable_image=${STABLE_IMAGE}" \
    -var="canary_image=${CANARY_IMAGE}" \
    -var="stable_traffic_percent=100" \
    -var="canary_traffic_percent=0" \
    -var="canary_faults_enabled=false"; then
    TRAFFIC_MODIFIED=false
    ROLLING_BACK=false
    return 0
  fi
  echo "Rollback failed."
  ROLLING_BACK=false
  return 1
}

handle_unexpected_error() {
  local error_code="$1"
  if [ "$TRAFFIC_MODIFIED" = true ] && [ "$ROLLING_BACK" = false ]; then
    echo "Unexpected error after traffic modification; attempting rollback."
    rollback || true
  fi
  exit "$error_code"
}

trap 'handle_unexpected_error "$?"' ERR

run_stage() {
  local stage="$1"
  local canary_percent="$2"
  local faults="$3"
  local bake="$4"

  echo "Applying Canary stage ${stage}: ${canary_percent}% Canary."
  stage_apply "$canary_percent" "$faults"

  if [ "$stage" = "0" ]; then
    # Etapa 0 vía Load Balancer:
    #  - con "x-canary: true" debe responder el canary (v4);
    #  - sin cabecera debe responder el stable (0% público al canary).
    local header_ok=false public_ok=false
    for attempt in {1..30}; do
      local status
      if [ "$header_ok" = false ]; then
        status=$(curl --silent --show-error --retry 2 \
          -H "x-canary: true" \
          -D /tmp/canary-headers \
          -o /dev/null \
          -w "%{http_code}" \
          "${LOAD_BALANCER_URL}/api/v4/books" || true)
        if [[ "$status" =~ ^2[0-9][0-9]$ ]] &&
          grep -qi '^x-app-track: canary' /tmp/canary-headers; then
          echo "x-canary header routed to Canary."
          header_ok=true
        fi
      fi

      if [ "$public_ok" = false ]; then
        status=$(curl --silent --show-error --retry 2 \
          -D /tmp/stable-headers \
          -o /dev/null \
          -w "%{http_code}" \
          "${LOAD_BALANCER_URL}/api/v3/books" || true)
        if [[ "$status" =~ ^2[0-9][0-9]$ ]] &&
          grep -qi '^x-app-track: stable' /tmp/stable-headers; then
          echo "Public traffic without header routed to Stable."
          public_ok=true
        fi
      fi

      if [ "$header_ok" = true ] && [ "$public_ok" = true ]; then
        echo "Internal Canary smoke test passed."
        return 0
      fi
      sleep 10
    done
    echo "Internal Canary smoke test failed (header_ok=${header_ok}, public_ok=${public_ok})."
    rollback
    return 2
  fi

  echo "Baking ${bake} seconds at ${canary_percent}% Canary."
  if ! sleep "$bake"; then
    echo "Bake time interrupted; attempting rollback."
    rollback
    return 3
  fi

  if [ "$stage" = "3" ]; then
    echo "Stage 3 promoted after verified stage 2 approval; no stable sample required."
    return 0
  fi

