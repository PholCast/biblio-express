#!/usr/bin/env bash
# Positive: an alert policy is toggled -> UpdateAlertPolicy audit log -> gd3-telemetry-tamper fires.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.log; : > "$log"
echo "$(date -u +%FT%TZ) toggling 5xx alert to trigger tamper" | tee -a "$log"
gcloud monitoring policies update "$ALERT_POLICY_5XX" --no-enabled --project="$GCP_PROJECT" --quiet >/dev/null 2>&1
gcloud monitoring policies update "$ALERT_POLICY_5XX" --enabled  --project="$GCP_PROJECT" --quiet >/dev/null 2>&1
gd_assert_fires "gd3-telemetry-tamper" 6 | tee -a "$log"
