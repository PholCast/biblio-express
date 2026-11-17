#!/usr/bin/env bash
# Positive: run the v1 assistant on an injected book -> it emits ai_injection_suspected -> fires.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.log; : > "$log"
node "$GD_ROOT/detections/tests/gd3-ai-agent-guard/seed-and-run.mjs" | tee -a "$log"
gd_assert_fires "gd3-ai-agent-guard" 6 | tee -a "$log"
