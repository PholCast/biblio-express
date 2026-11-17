// Tools the SOC assistant can call (plan P2). Two read tools and one tool with effect.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

export function loadEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

export function gcloud(args, extra = []) {
  // AI_IMPERSONATE makes the assistant act under its own service account (ephemeral token),
  // which is the "identidad de agentes de IA" trend. Empty = the operator's own identity.
  const imp = process.env.AI_IMPERSONATE ? [`--impersonate-service-account=${process.env.AI_IMPERSONATE}`] : [];
  const r = spawnSync('gcloud', [...args, ...extra, ...imp], { encoding: 'utf8', shell: true });
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

// Emits a gd-ai-assistant log event; the gd3-ai-agent-guard rule alerts on these.
export function emitEvent(project, event, detail) {
  const payload = JSON.stringify({ event, ...detail }).replace(/"/g, '\\"');
  return gcloud(['logging', 'write', 'gd-ai-assistant', `"${payload}"`,
    `--project=${project}`, '--payload-type=json', '--severity=WARNING']);
}

export const declarations = [
  {
    name: 'get_flow_snapshot',
    description: 'Calls GET /api/v5/flujo on the coordinator with the given trace id and returns the JSON of the three entities.',
    parameters: { type: 'object', properties: { trace_id: { type: 'string' } }, required: ['trace_id'] },
  },
  {
    name: 'get_events',
    description: 'Returns recent game day events (alerts, markers and service logs) for the analysis.',
    parameters: {
      type: 'object',
      properties: { trace_id: { type: 'string' }, minutes: { type: 'number' } },
      required: ['minutes'],
    },
  },
  {
    name: 'set_alert_enabled',
    description: 'Enables or disables a Cloud Monitoring alert policy. This action has an effect on the platform.',
    parameters: {
      type: 'object',
      properties: { policy: { type: 'string' }, enabled: { type: 'boolean' } },
      required: ['policy', 'enabled'],
    },
  },
];

export const READ_ONLY = ['get_flow_snapshot', 'get_events'];

export function makeTools(env, opts) {
  const project = `--project=${env.GCP_PROJECT}`;
  return {
    async get_flow_snapshot({ trace_id }) {
      const res = await fetch(`${env.COORDINATOR_URL}/api/v5/flujo`, { headers: { 'x-trace-id': trace_id } });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    async get_events({ trace_id, minutes = 30 }) {
      if (opts.eventsFile) {
        return readFileSync(opts.eventsFile, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
      }
      const filter = `(logName:"gameday-markers" OR resource.labels.service_name="${env.RUN_SERVICE}")`
        + (trace_id ? ` AND "${trace_id}"` : '');
      const r = gcloud(['logging', 'read', `"${filter.replace(/"/g, '\\"')}"`, project,
        `--freshness=${Math.round(minutes)}m`, '--limit=50', '--format=json']);
      if (r.code !== 0) return { error: r.err };
      return JSON.parse(r.out || '[]').map((e) => ({
        ts: e.timestamp,
        severity: e.severity,
        log: (e.logName || '').split('/').pop(),
        status: e.httpRequest?.status,
        path: e.httpRequest?.requestUrl?.replace(/^https?:\/\/[^/]+/, ''),
        msg: e.textPayload || JSON.stringify(e.jsonPayload || {}).slice(0, 300),
      }));
    },
    async set_alert_enabled({ policy, enabled }, identity = []) {
      const r = gcloud(['monitoring', 'policies', 'update', policy, enabled ? '--enabled' : '--no-enabled',
        project, '--quiet'], identity);
      return { code: r.code, result: r.code === 0 ? 'updated' : r.err.slice(0, 300) };
    },
  };
}
