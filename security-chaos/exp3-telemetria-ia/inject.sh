#!/usr/bin/env bash
# Exp. 3 phase A (plan P3): blind the telemetry of biblio-express.
#  1. exclusion gd3-blind on the _Default sink (logs of the Cloud Run service stop arriving)
#  2. 5xx alert policy disabled
#  3. one flow request every 30 s until the window ends, it is contained or STOP is set.
# Usage: ./inject.sh <round 0|1> [run] [window_minutes]
set -u
cd "$(dirname "$0")"
GD_EXP=exp3; GD_ROUND="${1:?round 0|1}"; GD_RUN="${2:-1}"; WINDOW_MIN="${3:-20}"
. ../lib/gameday.sh
GD_ROLLBACK="$PWD/rollback.sh"; export GD_ROUND GD_RUN

if [ -f "$GD_ROOT/STOP" ]; then echo "STOP is set: remove security-chaos/STOP first"; exit 1; fi
GD_TRACE="$(gd_new_trace 3 "$GD_ROUND" "$GD_RUN")"
echo "$GD_TRACE" > "$GD_EVIDENCE/current-trace.txt"
rm -f "$GD_EVIDENCE/contained.flag"
p="--project=$GCP_PROJECT"
filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$RUN_SERVICE\""

gd_check_stop
gd_log inject_start window "${WINDOW_MIN}m flow=$(gd_canary_flow)"

gd_check_stop
if gcloud logging sinks update _Default $p --add-exclusion="name=gd3-blind,filter=$filter" >/dev/null 2>&1; then
  gd_log inject_start exclusion_gd3-blind applied
else
  gd_log inject_start exclusion_gd3-blind failed
fi

gd_check_stop
if gcloud monitoring policies update "$ALERT_POLICY_5XX" --no-enabled $p --quiet >/dev/null 2>&1; then
  gd_log inject_start alert_5xx_disabled applied
else
  gd_log inject_start alert_5xx_disabled failed
fi

end=$(( $(date +%s) + WINDOW_MIN * 60 ))
while [ "$(date +%s)" -lt "$end" ]; do
  gd_check_stop
  if [ -f "$GD_EVIDENCE/contained.flag" ]; then
    gd_log inject_end window "contained by operator"
    exit 0
  fi
  code=$(gd_canary_flow)
  echo "$(gd_now) flow=$code"
  sleep 30
done

# Nobody contained it inside the window: register it and revert automatically.
gd_log inject_end window "not contained within ${WINDOW_MIN}m"
"$GD_ROLLBACK" auto
