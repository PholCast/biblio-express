#!/usr/bin/env bash
# Shared game day helpers (plan C5). Same interface in the three repos.
# Usage: source "$(dirname "$0")/../lib/gameday.sh"

GD_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$GD_ROOT/gameday.env" ] && . "$GD_ROOT/gameday.env"

: "${GD_PROVIDER:=gcp}"
: "${GD_ACTOR:=phol}"
: "${GD_ROUND:=0}"
: "${GD_RUN:=1}"
: "${GD_EXP:=exp0}"
: "${GD_EVIDENCE:=$GD_ROOT/evidence/$GD_EXP/ronda-$GD_ROUND}"
mkdir -p "$GD_EVIDENCE"

gd_now()  { date -u +%Y-%m-%dT%H:%M:%SZ; }
gd_uuid() { node -e 'console.log(require("crypto").randomUUID())'; }

# gd_new_trace <exp> <round> <run>  -> gd-e3-r0-n1-<uuid>  (Exp. 4 uses the gd4- prefix)
gd_new_trace() { echo "gd-e$1-r$2-n$3-$(gd_uuid)"; }

# Writes the marker line to the cloud log so the timeline can be rebuilt there.
gd_cloud_marker() {
  local line; line="$(cat)"
  if [ "$GD_PROVIDER" = gcp ]; then
    gcloud logging write gameday-markers "$line" --payload-type=json \
      --severity=NOTICE --project="$GCP_PROJECT" >/dev/null 2>&1 || echo "WARN: marker not sent" >&2
  fi
}

# gd_log <phase> <action> <result>  -> local bitacora + cloud marker
gd_log() {
  printf '{"ts":"%s","gameday_id":"gd-2026-11-17","experiment":"%s","round":%s,"run":%s,"phase":"%s","trace_id":"%s","actor":"%s","action":"%s","result":"%s"}\n' \
    "$(gd_now)" "$GD_EXP" "$GD_ROUND" "$GD_RUN" "$1" "$GD_TRACE" "$GD_ACTOR" "$2" "$3" \
    | tee -a "$GD_EVIDENCE/bitacora.jsonl" | gd_cloud_marker
}

# One request through the whole flow carrying the run trace id. Prints the HTTP code.
gd_canary_flow() {
  curl -s -o /dev/null -w '%{http_code}' -H "x-trace-id: $GD_TRACE" "$COORDINATOR_URL/api/v5/flujo"
}

# Stop switch: file security-chaos/STOP or GAMEDAY_STOP=1 aborts and rolls back.
gd_check_stop() {
  if [ -f "$GD_ROOT/STOP" ] || [ "${GAMEDAY_STOP:-0}" = 1 ]; then
    gd_log aborted stop_switch triggered
    "${GD_ROLLBACK:-./rollback.sh}"
    exit 99
  fi
}
