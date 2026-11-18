#!/usr/bin/env bash
# Positive: an alert policy is toggled -> UpdateAlertPolicy audit log -> gd3-telemetry-tamper fires.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.positive.log; : > "$log"
# The rule notifies at most once per 5 minutes: wait out any earlier tamper notification first.
echo "$(date -u +%FT%TZ) waiting 330 s of quiet for the notification rate limit" | tee -a "$log"
sleep 330
gcloud pubsub subscriptions pull gd-alerts-pull --project="$GCP_PROJECT" --auto-ack --limit=100 >/dev/null 2>&1
echo "$(date -u +%FT%TZ) toggling 5xx alert to trigger tamper" | tee -a "$log"
gcloud monitoring policies update "$ALERT_POLICY_5XX" --no-enabled --project="$GCP_PROJECT" --quiet >/dev/null 2>&1
gcloud monitoring policies update "$ALERT_POLICY_5XX" --enabled  --project="$GCP_PROJECT" --quiet >/dev/null 2>&1
gd_assert_fires "gd3-telemetry-tamper" 6 | tee -a "$log"
