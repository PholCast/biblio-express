#!/usr/bin/env bash
# Operator-contained round (plan P6). Injects, waits for a gd3 alert in Pub/Sub, contains on the
# first one (records t_detect), then measures. Usage: ./run-operator-round.sh <round> [cap_min]
set -u
cd "$(dirname "$0")"
GD_EXP=exp3; GD_ROUND="${1:?round}"; GD_RUN="${2:-1}"; CAP="${3:-12}"
. ../lib/gameday.sh
ev="$GD_ROOT/evidence/exp3/ronda-$GD_ROUND"; mkdir -p "$ev"
rm -f "$GD_ROOT/STOP" "$ev/contained.flag" "$ev/alerts.json"

echo "[R$GD_ROUND] injecting (cap ${CAP}m)…"
bash inject.sh "$GD_ROUND" "$GD_RUN" "$CAP" > "$ev/injectA.log" 2>&1 &
inj=$!

# Watch Pub/Sub for the first gd3 alert; record it and stop injecting.
tdetect=""; policy=""
end=$(( $(date +%s) + CAP * 60 ))
while [ "$(date +%s)" -lt "$end" ]; do
  pulled=$(gcloud pubsub subscriptions pull gd-alerts-pull --project="$GCP_PROJECT" --auto-ack \
    --limit=10 --format=json 2>/dev/null | tr -d '\r')
  hit=$(echo "$pulled" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=JSON.parse(s||"[]")||[];const out=[];for(const m of a){try{const d=JSON.parse(Buffer.from(m.message.data,"base64").toString());const p=d.incident?.policy_name||"";if(/^gd3-/.test(p))out.push({publish_time:m.message.publishTime,policy:p,state:d.incident?.state});}catch(e){}}process.stdout.write(JSON.stringify(out))})')
  if [ "$hit" != "[]" ] && [ -n "$hit" ]; then
    echo "$hit" > "$ev/alerts.json"
    tdetect=$(echo "$hit" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{console.log(JSON.parse(s)[0].publish_time)})')
    policy=$(echo "$hit" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{console.log(JSON.parse(s)[0].policy)})')
    echo "[R$GD_ROUND] detected: $policy at $tdetect"
    break
  fi
  sleep 15
done

echo "[R$GD_ROUND] containing (operator rollback)…"
GD_ROUND="$GD_ROUND" GD_RUN="$GD_RUN" bash rollback.sh operator
wait "$inj" 2>/dev/null

GD_ROUND="$GD_ROUND" GD_RUN="$GD_RUN" T_DETECT="$tdetect" bash measure.sh
echo "[R$GD_ROUND] done"
