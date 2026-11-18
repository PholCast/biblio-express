#!/usr/bin/env bash
# Negative: normal flow traffic must not change any sink/alert, so tamper stays quiet.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.negative.log
gd_assert_quiet "gd3-telemetry-tamper" "${1:-10}" | tee -a "$log"
