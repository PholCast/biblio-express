#!/usr/bin/env bash
# Shared helpers for detection tests (plan C9). Each rule has a positive.sh (adverse condition
# must fire the alert) and a negative.sh (normal traffic must not fire it). Results go to
# tests/<rule>/last-run.log.
GD_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ -f "$GD_ROOT/gameday.env" ] && . "$GD_ROOT/gameday.env"
: "${GCP_PROJECT:=biblio-express-final-2026}"

# Pulls alert messages and prints the policy display names seen (one per line).
gd_pull_policies() {
  gcloud pubsub subscriptions pull gd-alerts-pull --project="$GCP_PROJECT" --auto-ack \
    --limit=25 --format=json 2>/dev/null | tr -d '\r' \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{(JSON.parse(s||"[]")||[]).forEach(m=>{try{const d=JSON.parse(Buffer.from(m.message.data,"base64").toString());console.log(d.incident?.policy_name||"")}catch(e){}})})'
}

# gd_assert_fires <policy-substring> <minutes>  -> waits for a matching alert
gd_assert_fires() {
  local want="$1" mins="${2:-6}" end=$(( $(date +%s) + mins * 60 ))
  while [ "$(date +%s)" -lt "$end" ]; do
    if gd_pull_policies | grep -q "$want"; then echo "PASS: $want fired"; return 0; fi
    sleep 20
  done
  echo "FAIL: $want did not fire within ${mins}m"; return 1
}

# gd_assert_quiet <policy-substring> <minutes>  -> normal traffic must not fire it
gd_assert_quiet() {
  local want="$1" mins="${2:-10}"
  bash "$GD_ROOT/lib/normal-traffic.sh" "$mins" >/dev/null 2>&1 &
  local pid=$!
  local end=$(( $(date +%s) + mins * 60 ))
  while [ "$(date +%s)" -lt "$end" ]; do
    if gd_pull_policies | grep -q "$want"; then kill $pid 2>/dev/null; echo "FAIL: $want fired on normal traffic"; return 1; fi
    sleep 20
  done
  wait $pid 2>/dev/null
  echo "PASS: $want stayed quiet under normal traffic"; return 0
}
