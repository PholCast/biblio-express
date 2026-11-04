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

wait_for_traffic_split() {
  local canary_percent="$1"
  local samples="${SPLIT_SAMPLE_REQUESTS:-200}"
  local max_attempts="${SPLIT_MAX_ATTEMPTS:-40}"
  local attempt canary_hits observed_percent

  for attempt in $(seq 1 "$max_attempts"); do
    canary_hits=$(seq 1 "$samples" |
      xargs -P 20 -I{} curl --silent --max-time 10 -o /dev/null -D - \
        "${LOAD_BALANCER_URL}/health" 2>/dev/null |
      tr -d '\r' |
      grep -ci '^x-app-track: canary' || true)
    observed_percent=$((canary_hits * 100 / samples))
    echo "Traffic split check ${attempt}/${max_attempts}: ${observed_percent}% Canary observed (target ${canary_percent}%)."

    if [ "$canary_percent" -eq 100 ]; then
      if [ "$canary_hits" -eq "$samples" ]; then
        return 0
      fi
    elif [ $((canary_hits * 100)) -ge $((samples * canary_percent * 6 / 10)) ]; then
      return 0
    fi
    sleep 15
  done
  return 1
}

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

  if ! wait_for_traffic_split "$canary_percent"; then
    echo "Load Balancer did not apply ${canary_percent}% Canary in time; rolling back."
    rollback
    return 3
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

  local attempt start end gate_code
  for attempt in $(seq 1 "${MAX_GATE_RETRIES}"); do
    echo "Quality Gate attempt ${attempt}/${MAX_GATE_RETRIES}."
    start=$(date +%s)
    set +e
    node "$SCRIPT_ROOT/canary-load.js" "$LOAD_BALANCER_URL" "$canary_percent" \
      "$TARGET_REQUESTS_PER_TRACK" "$LOAD_CONCURRENCY" "$MAX_OBSERVATION_SECONDS"
    local load_code=$?
    elapsed=$(( $(date +%s) - start ))
    if [ "$elapsed" -lt "$MAX_OBSERVATION_SECONDS" ]; then
      sleep $((MAX_OBSERVATION_SECONDS - elapsed))
    fi
    end=$(date +%s)

    node "$SCRIPT_ROOT/cloud-monitoring-snapshot.js" \
      "$start" "$end" snapshot.json
    local snapshot_code=$?
    set -e

    if [ "$load_code" -ne 0 ] || [ "$snapshot_code" -ne 0 ]; then
      echo "Traffic generation or Cloud Monitoring snapshot failed; rolling back."
      rollback
      return 3
    fi

    set +e
    node "$SCRIPT_ROOT/canary-quality-gate.js" snapshot.json
    gate_code=$?
    set -e

    case "$gate_code" in
      0)
        echo "Quality Gate: promote."
        set +e
        jq --arg stage "$stage" --arg run_id "${GITHUB_RUN_ID:-0}" \
          --arg commit_sha "${GITHUB_SHA:-}" \
          --arg canary_image "$CANARY_IMAGE" --arg stable_image "$STABLE_IMAGE" \
          '. + {
            decision: "promote",
            stage: ($stage | tonumber),
            run_id: ($run_id | tonumber),
            commit_sha: $commit_sha,
            canary_image: $canary_image,
            stable_image: $stable_image
          }' \
          snapshot.json > "stage-${stage}-approved.json"
        local evidence_code=$?
        set -e
        if [ "$evidence_code" -ne 0 ]; then
          echo "Unable to create stage approval evidence; rolling back."
          rollback
          return 3
        fi
        return 0
        ;;
      1)
        if [ "$attempt" -lt "$MAX_GATE_RETRIES" ]; then
          echo "Quality Gate: pause; collecting another sample."
          continue
        fi
        echo "Quality Gate: pause; maximum retries reached."
        rollback
        return 1
        ;;
      2)
        echo "Quality Gate: abort; rolling back."
        rollback
        return 2
        ;;
      *)
        echo "Quality Gate failed with internal/configuration error."
        rollback
        return 3
        ;;
    esac
  done
}

if [ "${PROMOTION_MODE}" = "automatic" ]; then
  run_stage 0 0 "$CANARY_FAULTS_ENABLED" 0
  run_stage 1 10 "$CANARY_FAULTS_ENABLED" "$BAKE_TIME_SECONDS"
  run_stage 2 25 "$CANARY_FAULTS_ENABLED" "$BAKE_TIME_SECONDS"
  run_stage 3 100 false "$BAKE_TIME_SECONDS"
else
  case "$DEPLOYMENT_STAGE" in
    0) run_stage 0 0 "$CANARY_FAULTS_ENABLED" 0 ;;
    1) run_stage 1 10 "$CANARY_FAULTS_ENABLED" "$BAKE_TIME_SECONDS" ;;
    2) run_stage 2 25 "$CANARY_FAULTS_ENABLED" "$BAKE_TIME_SECONDS" ;;
    3)
      if [ "${STAGE2_APPROVED:-false}" != "true" ]; then
        echo "Stage 3 requires verified approval evidence from stage 2."
        exit 3
      fi
      run_stage 3 100 false "$BAKE_TIME_SECONDS"
      ;;
    *) echo "Invalid deployment stage: $DEPLOYMENT_STAGE"; exit 3 ;;
  esac
fi
