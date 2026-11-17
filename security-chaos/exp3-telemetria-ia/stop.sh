#!/usr/bin/env bash
# Exp. 3 stop switch (plan C5): sets security-chaos/STOP and reverts at once.
# inject.sh sees the file on its next check and exits. Remove the file before the next run.
set -u
cd "$(dirname "$0")"
touch ../STOP
echo "STOP set at $(date -u +%Y-%m-%dT%H:%M:%SZ); rolling back"
./rollback.sh stop_switch
