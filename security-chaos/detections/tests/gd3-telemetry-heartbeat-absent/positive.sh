#!/usr/bin/env bash
# Positive: exclude the service logs (gd3-blind) -> heartbeat metric goes absent -> alert fires.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.positive.log; : > "$log"
filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$RUN_SERVICE\""
echo "$(date -u +%FT%TZ) applying gd3-blind exclusion" | tee -a "$log"
gcloud logging sinks update _Default --add-exclusion="name=gd3-blind,filter=$filter" --project="$GCP_PROJECT" >/dev/null 2>&1
gd_assert_fires "gd3-telemetry-heartbeat-absent" 14 | tee -a "$log"
echo "$(date -u +%FT%TZ) removing exclusion" | tee -a "$log"
gcloud logging sinks update _Default --remove-exclusions=gd3-blind --project="$GCP_PROJECT" >/dev/null 2>&1
