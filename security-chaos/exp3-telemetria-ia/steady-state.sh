#!/usr/bin/env bash
# Exp. 3 security steady state (plan P1). Read-only: it only lists GCP config.
# Output: evidence/exp3/estado-estable.json (or the path given as $1).
set -u
cd "$(dirname "$0")"
GD_EXP=exp3; GD_TRACE="gd-e3-steady-$(date -u +%H%M%S)"
. ../lib/gameday.sh

out="${1:-$GD_ROOT/evidence/exp3/estado-estable.json}"
tmp="$(mktemp -d)"
p="--project=$GCP_PROJECT"
svc="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$RUN_SERVICE\""
strip_cr() { tr -d '\r'; }

gcloud logging sinks list $p --format=json > "$tmp/sinks.json"
gcloud logging buckets list --location=global $p --format=json > "$tmp/buckets.json"
gcloud monitoring policies list $p --format=json > "$tmp/policies.json"
# Notification channels need the gcloud beta component; the REST API avoids installing it.
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token | strip_cr)" \
  "https://monitoring.googleapis.com/v3/projects/$GCP_PROJECT/notificationChannels" > "$tmp/channels.raw"
gcloud monitoring uptime list-configs $p --format=json > "$tmp/uptime.json" 2>/dev/null || echo '[]' > "$tmp/uptime.json"
gcloud logging read "$svc" $p --freshness=10m --limit=1000 --format="value(timestamp)" | strip_cr > "$tmp/logs.txt"
gcloud iam service-accounts list $p --format="value(email)" | strip_cr > "$tmp/sas.txt"
: > "$tmp/keys.txt"
while read -r sa; do
  [ -n "$sa" ] && gcloud iam service-accounts keys list --iam-account="$sa" --managed-by=user \
    $p --format='value(name)' | strip_cr | sed "s|^|$sa |" >> "$tmp/keys.txt"
done < "$tmp/sas.txt"
health=$(curl -s -o /dev/null -w '%{http_code}' "$BIBLIO_URL/health")
flow=$(gd_canary_flow)

node - "$tmp" "$out" "$health" "$flow" "$(gd_now)" <<'NODE'
const fs = require('fs'); const [dir, out, health, flow, ts] = process.argv.slice(2);
const j = (f) => JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8') || '[]');
const lines = (f) => fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const channels = JSON.parse(fs.readFileSync(`${dir}/channels.raw`, 'utf8') || '{}').notificationChannels || [];
const result = {
  measured_at: ts,
  layer: 'Detección y respuesta (biblio-express, GCP)',
  sinks: j('sinks.json').map((s) => ({ name: s.name, destination: s.destination,
    exclusions: (s.exclusions || []).map((e) => e.name), disabled: !!s.disabled })),
  log_buckets: j('buckets.json').map((b) => ({ name: b.name.split('/').pop(),
    retention_days: b.retentionDays, locked: !!b.locked })),
  alert_policies: j('policies.json').map((a) => ({ name: a.displayName, id: a.name,
    enabled: a.enabled !== false, channels: (a.notificationChannels || []).length })),
  notification_channels: channels.map((c) => ({ type: c.type, name: c.displayName })),
  uptime_checks: j('uptime.json').map((u) => u.displayName),
  service_log_entries_last_10m: lines('logs.txt').length,
  service_accounts: lines('sas.txt'),
  user_managed_sa_keys: lines('keys.txt').length,
  health_http: Number(health), flow_http: Number(flow),
};
result.telemetry_coverage = {
  logs_flowing: result.service_log_entries_last_10m > 0,
  alerts_with_channel: result.alert_policies.filter((a) => a.enabled && a.channels > 0).length,
  heartbeat_alert: result.alert_policies.some((a) => /heartbeat/i.test(a.name)),
  tamper_alert: result.alert_policies.some((a) => /tamper/i.test(a.name)),
  immutable_log_bucket: result.log_buckets.some((b) => b.locked && b.name !== '_Required'),
};
fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.telemetry_coverage));
NODE
rm -rf "$tmp"
gd_log steady_state_ok steady_state "written $(basename "$out")"
