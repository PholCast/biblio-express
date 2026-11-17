#!/usr/bin/env bash
# Negative: run the v1 assistant on the clean flow (no injection) -> no event -> no alert.
set -u; cd "$(dirname "$0")"; . ../../lib.sh
log=last-run.log
node "$GD_ROOT/ai-assistant/assistant.mjs" --mode=v1 --trace-id="gd-e3-neg-$(date +%s)" >/dev/null 2>&1
gd_assert_quiet "gd3-ai-agent-guard" "${1:-5}" | tee -a "$log"
