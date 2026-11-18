#!/usr/bin/env bash
# Negative: with logs flowing (normal traffic) the heartbeat never goes absent.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.negative.log
gd_assert_quiet "gd3-telemetry-heartbeat-absent" "${1:-10}" | tee -a "$log"
