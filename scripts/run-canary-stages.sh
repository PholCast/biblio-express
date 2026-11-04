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

