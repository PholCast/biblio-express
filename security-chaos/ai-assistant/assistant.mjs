// SOC assistant (plan P2). Usage:
//   node assistant.mjs --mode=v0 --trace-id <id> [--events-file f.jsonl] [--out-dir dir]
// v0 = as it is today: instructions and data in one prompt, tools with effect run directly
// with the operator's credentials. v1 (hardened) is added in P5.
import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { declarations, makeTools, loadEnv } from './tools.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const env = { ...loadEnv(join(here, '..', 'gameday.env')), ...process.env };
const mode = args.mode || 'v0';
const traceId = args['trace-id'] || `gd-e3-triage-${Date.now()}`;
const outDir = args['out-dir'] || join(here, 'out', traceId);
mkdirSync(outDir, { recursive: true });

// gemini-3-flash-preview on the global endpoint is the Flash model this project can reach (verified 2026-11-17).
const MODEL = env.AI_MODEL || 'gemini-3-flash-preview';
const LOCATION = env.AI_LOCATION || 'global';
const MAX_ITERATIONS = 6;

const audit = (entry) => appendFileSync(join(outDir, 'agent-audit.jsonl'),
  `${JSON.stringify({ ts: new Date().toISOString(), mode, trace_id: traceId, ...entry })}\n`);

export async function runAssistant() {
  if (mode !== 'v0') throw new Error(`mode ${mode} is not available yet`);
  const ai = new GoogleGenAI({ vertexai: true, project: env.GCP_PROJECT, location: LOCATION });
  const tools = makeTools(env, { eventsFile: args['events-file'] });

  // v0: the flow data is pasted into the same text as the instructions.
  const snapshot = await tools.get_flow_snapshot({ trace_id: traceId });
  const prompt = `${readFileSync(join(here, 'prompts', 'v0-naive.md'), 'utf8')}\n`
    + `trace_id: ${traceId}\nalert policy 5xx: ${env.ALERT_POLICY_5XX}\n`
    + `flow snapshot: ${JSON.stringify(snapshot.body)}`;
  const contents = [{ role: 'user', parts: [{ text: prompt }] }];
  const config = { temperature: 0, tools: [{ functionDeclarations: declarations }] };

  let response;
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    // Last iteration: no more tool calls, the model must write the triage.
    const last = i === MAX_ITERATIONS - 1;
    if (last) contents.push({ role: 'user', parts: [{ text: 'Stop calling tools. Answer now with the JSON object only.' }] });
    response = await ai.models.generateContent({ model: MODEL,
      contents,
      config: last ? { ...config, toolConfig: { functionCallingConfig: { mode: 'NONE' } } } : config });
    const calls = response.functionCalls || [];
    if (!calls.length) break;
    contents.push(response.candidates[0].content);
    const parts = [];
    for (const call of calls) {
      const result = await tools[call.name](call.args || {});
      audit({ tool: call.name, args: call.args, decision: 'executed', result: summarize(result) });
      parts.push({ functionResponse: { name: call.name, response: { result } } });
    }
    contents.push({ role: 'user', parts });
  }

  const text = response?.text || '';
  const triage = parseJson(text);
  const out = { model: response?.modelVersion || MODEL, mode, trace_id: traceId, ...triage };
  writeFileSync(join(outDir, 'triage.json'), `${JSON.stringify(out, null, 2)}\n`);
  return out;
}

function summarize(result) {
  const s = JSON.stringify(result);
  return s.length > 400 ? `${s.slice(0, 400)}…` : result;
}

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : text); } catch { return { raw_text: text, parse_error: true }; }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runAssistant()
    .then((t) => console.log(JSON.stringify({ out: outDir, keys: Object.keys(t) })))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
