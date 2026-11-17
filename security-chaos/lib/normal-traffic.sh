#!/usr/bin/env bash
# Normal flow traffic (plan C8): one request every 2 s for <minutes>.
# It is the negative case of every detection test and the base of the false positive rate.
set -u
. "$(dirname "$0")/gameday.sh"

minutes="${1:-10}"
end=$(( $(date +%s) + minutes * 60 ))
ok=0; fail=0
while [ "$(date +%s)" -lt "$end" ]; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H "x-trace-id: gd-normal-$(gd_uuid)" \
    "$COORDINATOR_URL/api/v5/flujo")
  if [ "$code" = 200 ]; then ok=$((ok + 1)); else fail=$((fail + 1)); fi
  sleep 2
done
echo "{\"ts\":\"$(gd_now)\",\"minutes\":$minutes,\"ok\":$ok,\"fail\":$fail}"
