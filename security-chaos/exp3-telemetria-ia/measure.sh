#!/usr/bin/env bash
# Exp. 3 measurement (plan C7/C10). Reads the bitacora of the run, pulls the alert messages
# from Pub/Sub (gd-alerts-pull, created in P5) and writes results.json.
# Usage: GD_ROUND=<r> GD_RUN=<n> ./measure.sh   (optional T_DETECT=<ISO> for a manual reading)
set -u
cd "$(dirname "$0")"
GD_EXP=exp3; GD_ROUND="${GD_ROUND:-0}"; GD_RUN="${GD_RUN:-1}"
. ../lib/gameday.sh
GD_TRACE="$(cat "$GD_EVIDENCE/current-trace.txt")"

# Pull and keep every alert message (auto-ack consumes them, so they are saved first).
gcloud pubsub subscriptions pull gd-alerts-pull --project="$GCP_PROJECT" --auto-ack \
  --limit=50 --format=json 2>/dev/null | tr -d '\r' > "$GD_EVIDENCE/alerts-pull.json" \
  || echo '[]' > "$GD_EVIDENCE/alerts-pull.json"

node - "$GD_EVIDENCE" "$GD_TRACE" "$GD_ROUND" "$GD_RUN" "${T_DETECT:-}" <<'NODE'
const fs = require('fs');
const [dir, trace, round, run, manualDetect] = process.argv.slice(2);
const log = fs.readFileSync(`${dir}/bitacora.jsonl`, 'utf8').trim().split('\n').map(JSON.parse)
  .filter((e) => e.trace_id === trace);
const first = (phase) => log.find((e) => e.phase === phase)?.ts || null;
const t0 = first('inject_start');
const tContain = first('contained');
const tRollback = log.filter((e) => e.phase === 'rollback_done').pop()?.ts || null;

const old = fs.existsSync(`${dir}/alerts.json`) ? JSON.parse(fs.readFileSync(`${dir}/alerts.json`, 'utf8')) : [];
const pulled = (JSON.parse(fs.readFileSync(`${dir}/alerts-pull.json`, 'utf8') || '[]') || []).map((m) => {
  const data = JSON.parse(Buffer.from(m.message.data, 'base64').toString('utf8'));
  return { publish_time: m.message.publishTime, policy: data.incident?.policy_name, state: data.incident?.state };
});
const alerts = [...old, ...pulled];
fs.writeFileSync(`${dir}/alerts.json`, `${JSON.stringify(alerts, null, 2)}\n`);

const inWindow = alerts.filter((a) => t0 && a.publish_time >= t0 && a.state !== 'closed');
const tDetect = manualDetect || inWindow.map((a) => a.publish_time).sort()[0] || null;
const secs = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 1000) : null);
const map = { tamper: ['T1685.002', 'T1685'], heartbeat: ['T1685.002'], 'ai-agent-guard': ['AML.T0051.001'] };
const detected = [...new Set(inWindow.flatMap((a) =>
  Object.entries(map).filter(([k]) => (a.policy || '').includes(k)).flatMap(([, v]) => v)))];
const ai = fs.existsSync(`${dir}/ai-injection-results.json`)
  ? JSON.parse(fs.readFileSync(`${dir}/ai-injection-results.json`, 'utf8')) : null;
if (ai?.attempts?.some((a) => a.outcome === 'reporta')) detected.push('AML.T0051.001');

const result = {
  experiment: 'exp3', round: Number(round), run: Number(run), trace_id: trace,
  t0, t_detect: tDetect, t_contain: tContain, t_rollback_done: tRollback,
  mttd_s: secs(t0, tDetect), mttc_s: secs(t0, tContain),
  techniques_emulated: ['T1685.002', 'T1685', 'AML.T0051.001'],
  techniques_detected: [...new Set(detected)],
  alerts_fired: inWindow.map((a) => a.policy),
  false_positives: 0,
  hypothesis_result: tDetect && secs(t0, tDetect) <= 600 && tContain && secs(t0, tContain) <= 900 ? 'confirmada' : 'refutada',
  ai_injection: ai ? { mode: ai.mode, success_rate: ai.success_rate, outcomes: ai.outcomes } : null,
  notes: tDetect ? '' : 'no detectado (> ventana)',
};
fs.writeFileSync(`${dir}/results.json`, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ mttd_s: result.mttd_s, mttc_s: result.mttc_s, hypothesis: result.hypothesis_result }));
NODE
