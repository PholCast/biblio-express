#!/usr/bin/env bash
# Exp. 3 rollback (plan P3). Idempotent: removes gd3-blind, re-enables the 5xx policy and checks
# that a new service log arrives in <= 2 min. Usage: ./rollback.sh [operator|auto]
set -u
cd "$(dirname "$0")"
GD_EXP=exp3; GD_ROUND="${GD_ROUND:-0}"; GD_RUN="${GD_RUN:-1}"
. ../lib/gameday.sh
GD_TRACE="$(cat "$GD_EVIDENCE/current-trace.txt" 2>/dev/null || echo gd-e3-rollback)"
who="${1:-operator}"
p="--project=$GCP_PROJECT"
svc="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$RUN_SERVICE\""

gd_log rollback_start rollback "by $who"
gcloud logging sinks update _Default $p --remove-exclusions=gd3-blind >/dev/null 2>&1
gcloud monitoring policies update "$ALERT_POLICY_5XX" --enabled $p --quiet >/dev/null 2>&1

excl=$(gcloud logging sinks describe _Default $p --format='value(exclusions[].name)' | tr -d '\r')
enabled=$(gcloud monitoring policies describe "$ALERT_POLICY_5XX" $p --format='value(enabled)' | tr -d '\r')
[ "$who" = operator ] && { touch "$GD_EVIDENCE/contained.flag"; gd_log contained telemetry "restored by operator"; }
gd_log rollback_done config "exclusions=[${excl}] alert_5xx_enabled=${enabled}"

# A new log of the service must be visible again (<= 2 min).
since="$(gd_now)"; seen=""
for _ in $(seq 1 12); do
  gd_canary_flow >/dev/null
  seen=$(gcloud logging read "$svc AND timestamp>=\"$since\"" $p --limit=1 \
    --format='value(timestamp)' | tr -d '\r')
  [ -n "$seen" ] && break
  sleep 10
done

if [ -z "$excl" ] && [ "${enabled,,}" = true ] && [ -n "$seen" ]; then
  gd_log steady_state_restored telemetry "first log after rollback at $seen"
else
  gd_log aborted rollback "NOT restored: exclusions=[${excl}] enabled=${enabled} log=${seen:-none}"
  exit 1
fi
