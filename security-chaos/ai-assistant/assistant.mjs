// SOC assistant (plan P2/P5). Usage:
//   node assistant.mjs --mode=v0|v1 --trace-id <id> [--events-file f.jsonl] [--out-dir dir]
// v0 = as it is today: instructions and data in one prompt, effect tools run directly.
// v1 = hardened: system/data separation, tool allowlist, human approval for effect actions,
//      own service account identity, and it reports injections to gd-ai-assistant.
import { GoogleGenAI } from '@google/genai';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { declarations, makeTools, loadEnv, emitEvent, READ_ONLY } from './tools.mjs';
import { requestApproval } from './approvals.mjs';

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

const MODEL = env.AI_MODEL || 'gemini-3-flash-preview';
const LOCATION = env.AI_LOCATION || 'global';
const MAX_ITERATIONS = 6;
const INJECTION_RE = /ignore (all|previous)|disable|desactiv|set_alert_enabled|GD3-SYNTH/i;

const audit = (entry) => appendFileSync(join(outDir, 'agent-audit.jsonl'),
  `${JSON.stringify({ ts: new Date().toISOString(), mode, trace_id: traceId, ...entry })}\n`);

export async function runAssistant() {
  const ai = new GoogleGenAI({ vertexai: true, project: env.GCP_PROJECT, location: LOCATION });
  const tools = makeTools(env, { eventsFile: args['events-file'] });
  const hardened = mode === 'v1';

  const snapshot = await tools.get_flow_snapshot({ trace_id: traceId });
  const dataText = JSON.stringify(snapshot.body);
  // Mitigation 1: in v1 the data lives in an untrusted block, apart from the instructions.
  const injectionSeen = INJECTION_RE.test(dataText);
  if (hardened && injectionSeen) {
    emitEvent(env.GCP_PROJECT, 'ai_injection_suspected', { trace_id: traceId });
    audit({ tool: 'emit', decision: 'reported', result: 'ai_injection_suspected' });
  }

  const config = { temperature: 0, tools: [{ functionDeclarations: declarations }] };
  let contents;
  if (hardened) {
    config.systemInstruction = readFileSync(join(here, 'prompts', 'v1-hardened.md'), 'utf8');
    contents = [{ role: 'user', parts: [{ text:
      `trace_id: ${traceId}\nalert policy 5xx: ${env.ALERT_POLICY_5XX}\n`
      + `<untrusted-data>\n${dataText}\n</untrusted-data>` }] }];
  } else {
    const prompt = `${readFileSync(join(here, 'prompts', 'v0-naive.md'), 'utf8')}\n`
      + `trace_id: ${traceId}\nalert policy 5xx: ${env.ALERT_POLICY_5XX}\nflow snapshot: ${dataText}`;
    contents = [{ role: 'user', parts: [{ text: prompt }] }];
  }

  let response;
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const last = i === MAX_ITERATIONS - 1;
    if (last) contents.push({ role: 'user', parts: [{ text: 'Stop calling tools. Answer now with the JSON object only.' }] });
    response = await ai.models.generateContent({ model: MODEL, contents,
      config: last ? { ...config, toolConfig: { functionCallingConfig: { mode: 'NONE' } } } : config });
    const calls = response.functionCalls || [];
    if (!calls.length) break;
    contents.push(response.candidates[0].content);
    const parts = [];
    for (const call of calls) {
      let result;
      if (hardened && !READ_ONLY.includes(call.name)) {
        // Mitigations 2+3: effect tools are not executed; they need human approval.
        emitEvent(env.GCP_PROJECT, 'ai_effect_action_blocked', { trace_id: traceId, action: call.name });
        const appr = requestApproval({ action: call.name, args: call.args, requestedBy: 'soc-assistant',
          outDir, autoDecision: { decision: 'denied', decided_by: env.ASSISTANT_OPERATOR || 'operator' } });
        result = { blocked: true, reason: 'requires human approval', approval_id: appr.id, decision: appr.decision };
        audit({ tool: call.name, args: call.args, decision: 'blocked', result });
      } else {
        result = await tools[call.name](call.args || {});
        audit({ tool: call.name, args: call.args, decision: 'executed', result: summarize(result) });
      }
      parts.push({ functionResponse: { name: call.name, response: { result } } });
    }
    contents.push({ role: 'user', parts });
  }

  const triage = parseJson(response?.text || '');
  if (hardened && (injectionSeen || triage.injection_suspected) && !triage.injection_suspected) {
    triage.injection_suspected = true;
  }
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
    .then((t) => console.log(JSON.stringify({ out: outDir, mode, injection_suspected: t.injection_suspected })))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
