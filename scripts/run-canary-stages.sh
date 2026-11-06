#!/usr/bin/env bash
set -euo pipefail

TRAFFIC_MODIFIED=false
ROLLING_BACK=false

TRAFFIC_TARGETS=(
  -target=module.load_balancer.google_compute_url_map.this
  -target=module.canary.google_cloud_run_v2_service.this
)

stage_apply() {
  local canary_percent="$1"
  local faults="$2"
  local stage="$3"
  local stable_percent=$((100 - canary_percent))
  local fault_mode="none"
  local targets=()
  if [ "$faults" = "true" ]; then
    fault_mode="${CANARY_FAULT_MODE:-none}"
  fi
  if [ "$stage" != "0" ]; then
    targets=("${TRAFFIC_TARGETS[@]}")
  fi

  if ! terraform apply -input=false -auto-approve "${targets[@]}" \
      -var-file=terraform.tfvars \
      -var="stable_image=${STABLE_IMAGE}" \
      -var="canary_image=${CANARY_IMAGE}" \
      -var="stable_traffic_percent=${stable_percent}" \
      -var="canary_traffic_percent=${canary_percent}" \
      -var="canary_faults_enabled=${faults}" \
      -var="canary_fault_mode=${fault_mode}" \
      -var="canary_fault_rate=${CANARY_FAULT_RATE:-25}"; then
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
  if terraform apply -input=false -auto-approve "${TRAFFIC_TARGETS[@]}" \
    -var-file=terraform.tfvars \
    -var="stable_image=${STABLE_IMAGE}" \
    -var="canary_image=${CANARY_IMAGE}" \
    -var="stable_traffic_percent=100" \
    -var="canary_traffic_percent=0" \
    -var="canary_faults_enabled=false" \
    -var="canary_fault_mode=none"; then
    TRAFFIC_MODIFIED=false
    ROLLING_BACK=false
    set_traffic_weight 0
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

# Peso configurado en el URL map, publicado en Cloud Monitoring como
# custom.googleapis.com/biblio/canary_traffic_weight (una serie por track) para
# el panel del dashboard. Todo es best-effort: un fallo solo imprime un aviso y
# nunca detiene ni revierte el despliegue.
WEIGHT_FILE=$(mktemp 2>/dev/null || echo "/tmp/canary-weight-$$")
WEIGHT_HEARTBEAT_PID=""

weight_series_json() {
  printf '{"metric":{"type":"custom.googleapis.com/biblio/canary_traffic_weight","labels":{"track":"%s"}},"resource":{"type":"global","labels":{"project_id":"%s"}},"metricKind":"GAUGE","valueType":"DOUBLE","points":[{"interval":{"endTime":"%s"},"value":{"doubleValue":%s}}]}' \
    "$1" "$PROJECT_ID" "$2" "$3"
}

publish_traffic_weight() {
  local canary_percent="$1"
  local now token body status

  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  token=$(gcloud auth print-access-token 2>/dev/null) || token=""
  if [ -z "$token" ] || [ -z "${PROJECT_ID:-}" ]; then
    echo "Warning: could not publish traffic weight (no token or project)."
    return 0
  fi

  body="{\"timeSeries\":[$(weight_series_json canary "$now" "$canary_percent"),$(weight_series_json stable "$now" "$((100 - canary_percent))")]}"
  status=$(curl --silent --max-time 10 -o /dev/null -w "%{http_code}" \
    -X POST "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/timeSeries" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "$body" 2>/dev/null) || status="error"
  if [ "$status" != "200" ]; then
    echo "Warning: could not publish traffic weight (HTTP ${status})."
  fi
  return 0
}

# Registra el peso vigente; el heartbeat lo publica.
set_traffic_weight() {
  echo "$1" > "$WEIGHT_FILE" 2>/dev/null || true
  return 0
}

# Proceso en segundo plano (único escritor de la métrica): publica cuando el
# peso cambia y, si no, cada 30 s, para que la línea del panel sea continua.
# Respeta el límite de Cloud Monitoring de un punto cada 5 s por serie.
start_weight_heartbeat() {
  (
    set +e
    trap - ERR
    last_value=""
    last_publish=0
    while true; do
      value=$(cat "$WEIGHT_FILE" 2>/dev/null)
      now=$(date +%s)
      if [ -n "$value" ] && { [ "$value" != "$last_value" ] || [ $((now - last_publish)) -ge 30 ]; }; then
        publish_traffic_weight "$value"
        last_value="$value"
        last_publish=$now
      fi
      sleep 10
    done
  ) &
  WEIGHT_HEARTBEAT_PID=$!
}

# Al terminar: detiene el heartbeat y publica el último peso (p. ej. el 0 de un
# rollback) para que el panel refleje el estado final.
stop_weight_heartbeat() {
  if [ -n "$WEIGHT_HEARTBEAT_PID" ]; then
    kill "$WEIGHT_HEARTBEAT_PID" 2>/dev/null || true
    WEIGHT_HEARTBEAT_PID=""
    local final
    final=$(cat "$WEIGHT_FILE" 2>/dev/null) || final=""
    if [ -n "$final" ]; then
      sleep 5 || true
      publish_traffic_weight "$final" || true
    fi
  fi
  rm -f "$WEIGHT_FILE" 2>/dev/null || true
  return 0
}

trap 'stop_weight_heartbeat' EXIT
start_weight_heartbeat

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
      if [ $((canary_hits * 100)) -ge $((samples * ${PROMOTION_MIN_OBSERVED_PERCENT:-95})) ]; then
        return 0
      fi
    elif [ $((canary_hits * 100)) -ge $((samples * canary_percent * 6 / 10)) ] &&
      [ $((canary_hits * 100)) -le $((samples * canary_percent * 18 / 10)) ]; then
      return 0
    fi
    sleep 15
  done
  return 1
}

verify_url_map_weights() {
  local canary_percent="$1"
  local expected_stable=$((100 - canary_percent))
  local url_map="${URL_MAP_NAME:-biblio-express-demo-url-map}"
  local weights

  if ! weights=$(gcloud compute url-maps describe "$url_map" --global \
      --project "$PROJECT_ID" --format=json |
    node -e '
      let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
        const pm = JSON.parse(s).pathMatchers?.[0]?.defaultRouteAction?.weightedBackendServices ?? [];
        const w = (t) => pm.find((b) => b.backendService.endsWith(`-${t}-backend`))?.weight ?? 0;
        console.log(`${w("stable")} ${w("canary")}`);
      });'); then
    echo "Unable to read URL map ${url_map}."
    return 1
  fi

  echo "URL map ${url_map} configured weights: stable=${weights% *} canary=${weights#* } (expected stable=${expected_stable} canary=${canary_percent})."
  [ "$weights" = "${expected_stable} ${canary_percent}" ]
}

# Etapa 0: el tráfico público (sin cabecera) debe ir 100% al stable.
wait_for_public_stable() {
  local samples="${PUBLIC_SAMPLE_REQUESTS:-50}"
  local max_attempts="${SPLIT_MAX_ATTEMPTS:-40}"
  local attempt stable_hits

  for attempt in $(seq 1 "$max_attempts"); do
    stable_hits=$(seq 1 "$samples" |
      xargs -P 10 -I{} curl --silent --max-time 10 -o /dev/null -D - \
        "${LOAD_BALANCER_URL}/health" 2>/dev/null |
      tr -d '\r' |
      grep -ci '^x-app-track: stable' || true)
    echo "Public routing check ${attempt}/${max_attempts}: ${stable_hits}/${samples} public requests served by Stable."
    if [ "$stable_hits" -eq "$samples" ]; then
      echo "Public traffic without header routed to Stable."
      return 0
    fi
    sleep 15
  done
  return 1
}

# Etapa 0: ráfaga de pruebas internas con x-canary: true. Todas deben ser
# atendidas por el canary (enrutamiento) y al menos una debe responder 2xx.
x_canary_smoke_burst() {
  local rounds="${X_CANARY_ROUNDS:-3}"
  local max_ids="${X_CANARY_BOOK_IDS:-10}"
  local max_attempts=6
  local attempt total canary_hits ok_hits round id status track

  for attempt in $(seq 1 "$max_attempts"); do
    total=0 canary_hits=0 ok_hits=0
    for round in $(seq 1 "$rounds"); do
      for id in $(seq 1 "$max_ids"); do
        status=$(curl --silent --max-time 10 -H "x-canary: true" \
          -D /tmp/x-canary-headers -o /dev/null -w "%{http_code}" \
          "${LOAD_BALANCER_URL}/api/v4/books/${id}" || true)
        track=$(tr -d '\r' < /tmp/x-canary-headers 2>/dev/null |
          awk 'tolower($1) == "x-app-track:" { print $2 }' || true)
        total=$((total + 1))
        [ "$track" = "canary" ] && canary_hits=$((canary_hits + 1))
        [[ "$status" =~ ^2[0-9][0-9]$ ]] && ok_hits=$((ok_hits + 1))
      done
    done
    echo "x-canary burst ${attempt}/${max_attempts}: ${canary_hits}/${total} served by Canary, ${ok_hits} with 2xx."
    if [ "$canary_hits" -eq "$total" ] && [ "$ok_hits" -gt 0 ]; then
      echo "x-canary header routed to Canary."
      return 0
    fi
    sleep 10
  done
  return 1
}

run_stage() {
  local stage="$1"
  local canary_percent="$2"
  local faults="$3"
  local bake="$4"

  echo "Applying Canary stage ${stage}: ${canary_percent}% Canary."
  stage_apply "$canary_percent" "$faults" "$stage"

  if ! verify_url_map_weights "$canary_percent"; then
    echo "URL map does not match stage ${stage} weights; rolling back."
    rollback
    return 3
  fi
  set_traffic_weight "$canary_percent"

  if [ "$stage" = "0" ]; then
    if ! wait_for_public_stable; then
      echo "Public traffic did not return to Stable in time; rolling back."
      rollback
      return 2
    fi

    if ! x_canary_smoke_burst; then
      echo "Internal Canary smoke test failed; rolling back."
      rollback
      return 2
    fi
    echo "Internal Canary smoke test passed."
    return 0
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
    echo "Stage 3 promoted: URL map verified at 100% Canary after stage 2 approval."
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
