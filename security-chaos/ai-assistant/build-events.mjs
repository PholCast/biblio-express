// Builds the Exp. 3 events.jsonl (plan C10 schema) from Phol's evidence and merges the four
// experiments into one chronological file for the single AI triage (plan P8).
// Usage: node build-events.mjs   -> evidence/exp3/ronda-N/events.jsonl and docs/gameday/ia/events-gameday.jsonl
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ev = join(here, '..', 'evidence');
const outDir = join(here, '..', '..', 'docs', 'gameday', 'ia');
mkdirSync(outDir, { recursive: true });

const lines = (f) => (existsSync(f) ? readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : []);
const json = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const sevOf = (phase) => (phase === 'aborted' ? 'high' : 'info');

function exp3Events(round) {
  const dir = join(ev, 'exp3', `ronda-${round}`);
  const res = json(join(dir, 'results.json'));
  const out = [];
  for (const b of lines(join(dir, 'bitacora.jsonl'))) {
    out.push({ ts: b.ts, source: 'bitacora', experiment: 'exp3', round, trace_id: b.trace_id, severity: sevOf(b.phase),
      summary: `${b.phase}: ${b.action} -> ${b.result}`, raw: { phase: b.phase, action: b.action, result: b.result } });
  }
  for (const a of json(join(dir, 'alerts.json')) || []) {
    out.push({ ts: a.publish_time, source: 'pubsub gd-alerts', experiment: 'exp3', round, trace_id: res?.trace_id,
      severity: 'ALERT', summary: `${a.policy} ${a.state}`, raw: a });
  }
  const ai = json(join(dir, 'ai-injection-results.json'));
  for (const t of ai?.attempts || []) {
    out.push({ ts: res?.t_rollback_done || res?.t0, source: 'ai-assistant', experiment: 'exp3', round, trace_id: t.trace_id,
      severity: t.outcome === 'ejecuta' ? 'high' : 'warning',
      summary: `asistente ${ai.mode}: payload ${t.payload} -> ${t.outcome}`, raw: { mode: ai.mode, ...t } });
  }
  if (res) {
    out.push({ ts: res.t_rollback_done || res.t0, source: 'results', experiment: 'exp3', round, trace_id: res.trace_id,
      severity: 'info', summary: `resultado: MTTD ${res.mttd_s ?? 'n/a'} s, MTTC ${res.mttc_s ?? 'n/a'} s, hipotesis ${res.hypothesis_result}`,
      raw: { mttd_s: res.mttd_s, mttc_s: res.mttc_s, techniques_detected: res.techniques_detected, alerts_fired: res.alerts_fired } });
  }
  return out.filter((e) => e.ts).sort((a, b) => a.ts.localeCompare(b.ts));
}

const all = [];
for (const r of [0, 1]) {
  const e3 = exp3Events(r);
  writeFileSync(join(ev, 'exp3', `ronda-${r}`, 'events.jsonl'), `${e3.map((e) => JSON.stringify(e)).join('\n')}\n`);
  all.push(...e3);
}
const counts = { exp3: all.length };
for (const exp of ['exp1', 'exp2', 'exp4']) {
  let n = 0;
  for (const r of [0, 1]) {
    const f = lines(join(ev, exp, `ronda-${r}`, 'events.jsonl'));
    all.push(...f); n += f.length;
  }
  counts[exp] = n;
}
all.sort((a, b) => a.ts.localeCompare(b.ts));
writeFileSync(join(outDir, 'events-gameday.jsonl'), `${all.map((e) => JSON.stringify(e)).join('\n')}\n`);
console.log(JSON.stringify({ total: all.length, por_experimento: counts, desde: all[0].ts, hasta: all.at(-1).ts }));
