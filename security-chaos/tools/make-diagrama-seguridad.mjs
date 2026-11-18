// Generates docs/diagramas/arquitectura-seguridad-gameday.svg in the same visual style as
// arquitectura-flujo-caos.svg (white page, rounded panels, Google palette, Inter font).
// Usage: node make-diagrama-seguridad.mjs   (then render to PNG with headless Chrome, see README)
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'diagramas', 'arquitectura-seguridad-gameday.svg');
const W = 3200, H = 1940;
const FONT = "Inter, 'Segoe UI', 'DejaVu Sans', sans-serif";
const C = { ink: '#202124', mute: '#5F6368', line: '#DADCE0', panel: '#F8F9FA', aws: '#FF9900', gcp: '#1A73E8',
  k8s: '#326CE5', red: '#D93025', teal: '#007B83', purple: '#8430CE', green: '#188038' };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const parts = [];
const text = (x, y, s, size = 20, weight = 'normal', fill = C.ink, anchor = 'start') =>
  parts.push(`<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`);
const rect = (x, y, w, h, o = {}) =>
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.rx ?? 10}" fill="${o.fill ?? '#fff'}" stroke="${o.stroke ?? C.line}" stroke-width="${o.sw ?? 1.5}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`);
const arrow = (d, color, dash, label, lx, ly) => {
  parts.push(`<path d="${d}" stroke="${color}" stroke-width="3.5" fill="none"${dash ? ` stroke-dasharray="${dash}"` : ''} marker-end="url(#m${color.slice(1)})"/>`);
  if (label) {
    // White pill behind the label so it stays readable over the dashed trust boundaries.
    const lines = label.split('|');
    const pw = Math.max(...lines.map((l) => l.length)) * 9 + 22, ph = lines.length * 22 + 10;
    parts.push(`<rect x="${lx - pw / 2}" y="${ly - 20}" width="${pw}" height="${ph}" rx="8" fill="#fff" stroke="${color}" stroke-width="1.5"/>`);
    lines.forEach((l, i) => text(lx, ly + i * 22, l, 16, 'bold', color, 'middle'));
  }
};
const marker = (c) => `<marker id="m${c.slice(1)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;

parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${[C.red, C.gcp, C.purple, C.mute].map(marker).join('')}</defs>`);
parts.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`);
text(40, 62, 'Arquitectura de seguridad del game day: tres nubes, cinco capas', 40, 'bold');
text(40, 100, 'E1–E4 = punto de inyección · T1–T4 = punto de recolección de telemetría · borde rojo discontinuo = frontera de confianza · flecha azul = flujo GET /api/v5/flujo con x-trace-id', 20, 'normal', C.mute);

// Layout
const X0 = [320, 1300, 2280], PW = 860, BX = 30, BW = 800, ROW0 = 250, RH = 240, RG = 30;
const rowTop = (i) => ROW0 + i * (RH + RG);
const layers = ['Identidad', 'Red', 'Carga de trabajo', 'Datos', 'Detección y respuesta'];
const clouds = [
  { name: 'AWS us-east-1 · Neithan (Exp. 1) · frontera de confianza 1', col: C.aws, box: [
    ['Rol pokenetes-api-instance', 'GetSecretValue solo desde el VPC endpoint', 'GitHub Actions por OIDC, sin llaves estáticas'],
    ['ALB (HTTP)', 'Endpoint de interfaz de Secrets Manager', '443 solo desde el security group de la API'],
    ['API Pokenetes (coordinador) en EC2', 'Docker, imagen fijada por digest', 'Corre como root (riesgo residual)'],
    ['Secrets Manager: secreto de la app', 'Señuelo backup-admin-credentials (sintético)', 'RDS PostgreSQL'],
    ['CloudTrail + CloudWatch Logs (30 días)', 'Alarmas gd1-role-secret-outside-vpce y', 'gd1-honeytoken-touched · SNS pokenetes-security']] },
  { name: 'GCP biblio-express-final-2026 · Phol (Exp. 3) · frontera de confianza 2', col: C.gcp, box: [
    ['SA runtime de Cloud Run (acotada)', 'SA soc-assistant: solo lectura, sin llaves', 'Impersonación con tokens efímeros'],
    ['Ingreso público a Cloud Run', 'Sin WAF (riesgo residual)', 'Egreso a los pares por HTTP (riesgo residual)'],
    ['API biblio-express en Cloud Run', 'Asistente SOC (Gemini en Vertex AI), v0 y v1', 'Aprobación humana para acciones con efecto'],
    ['Cloud SQL PostgreSQL (backups y PITR)', 'Copia aislada WORM: retención 7 días bloqueada', 'Recibe los comprobantes por Storage Transfer'],
    ['Cloud Logging _Default (T2) → Cloud Monitoring (T3)', 'Reglas gd3-tamper, gd3-heartbeat-absent, gd3-ai-agent-guard', 'Pub/Sub + correo · bitácora gd-audit inmutable 30 días']] },
  { name: 'GCP GKE hospitaline-prod · Daniela (Exp. 2) · frontera de confianza 3', col: C.k8s, box: [
    ['Workload Identity: KSA hospitaline-api → GSA', 'Pods sin llaves de servicio', ''],
    ['NetworkPolicy default-deny + allow-list', 'Redis solo desde la API · egreso filtrado', 'NetworkLogging (cluster.deny.log)'],
    ['API Hospitaline (2 réplicas) y Redis', 'Sondas liveness y readiness · requests y limits', 'La API no declara runAsNonRoot (riesgo residual)'],
    ['Bucket de comprobantes del flujo', 'Retención 86400 s (sin bloqueo)', 'Auditoría DATA_WRITE de Cloud Storage'],
    ['policy-action + auditoría (T4)', 'gd2-netpol-deny · gd2-undeclared-workload', 'gd4-mass-object-destruction']] },
];
const boxPos = (c, r) => ({ x: X0[c] + BX, y: rowTop(r), w: BW, h: RH });

// Layer labels
layers.forEach((l, i) => {
  rect(40, rowTop(i), 250, RH, { fill: '#fff', stroke: C.line });
  text(165, rowTop(i) + RH / 2 + 8, l, 22, 'bold', C.ink, 'middle');
});
// Panels + boxes
clouds.forEach((cl, c) => {
  rect(X0[c], 160, PW, rowTop(4) + RH - 160 + 30, { rx: 14, fill: C.panel, stroke: C.red, sw: 2.5, dash: '14 8' });
  text(X0[c] + 18, 191, cl.name, 20, 'bold', C.ink);
  cl.box.forEach((lines, r) => {
    const b = boxPos(c, r);
    rect(b.x, b.y, b.w, b.h, { stroke: cl.col, sw: 2 });
    lines.filter(Boolean).forEach((s, i) => text(b.x + 24, b.y + 62 + i * 52, s, i === 0 ? 24 : 20, i === 0 ? 'bold' : 'normal', i === 0 ? C.ink : C.mute));
  });
});

// Client and flow arrows
rect(40, 170, 250, 66, { fill: '#fff', stroke: C.gcp, sw: 2 });
text(165, 200, 'Cliente', 20, 'bold', C.ink, 'middle');
text(165, 224, 'x-trace-id', 16, 'normal', C.mute, 'middle');
arrow(`M290,203 L335,203 L335,${rowTop(1) + RH / 2} L${X0[0] + BX},${rowTop(1) + RH / 2}`, C.gcp);
const yc = rowTop(2) + RH / 2;
arrow(`M${X0[0] + BX + BW},${yc} L${X0[1] + BX},${yc}`, C.gcp, null, 'GET /api/v5/|books/last', (X0[0] + BX + BW + X0[1] + BX) / 2, yc - 62);
arrow(`M${X0[1] + BX + BW},${yc} L${X0[2] + BX},${yc}`, C.gcp, null, 'GET /api/v5/|hospitals/last', (X0[1] + BX + BW + X0[2] + BX) / 2, yc - 62);
const yd = rowTop(3) + RH / 2;
arrow(`M${X0[2] + BX},${yd} L${X0[1] + BX + BW},${yd}`, C.purple, '10 8', 'Storage Transfer|(a demanda)', (X0[1] + BX + BW + X0[2] + BX) / 2, yd - 60);
// Hand the purple marker the same colour as the arrow
// Injection markers (E) and telemetry markers (T)
const E = (n, x, y) => {
  parts.push(`<circle cx="${x}" cy="${y}" r="26" fill="${C.red}"/>`);
  text(x, y + 8, n, 21, 'bold', '#fff', 'middle');
};
const T = (n, x, y) => {
  parts.push(`<rect x="${x - 26}" y="${y - 20}" width="52" height="40" rx="8" fill="${C.teal}"/>`);
  text(x, y + 8, n, 21, 'bold', '#fff', 'middle');
};
const tr = (c, r) => { const b = boxPos(c, r); return [b.x + b.w, b.y]; };
const tl = (c, r) => { const b = boxPos(c, r); return [b.x, b.y]; };
E('E1', ...tr(0, 0)); E('E2', ...tr(2, 1)); E('E3', ...tr(1, 2)); E('E3', ...tr(1, 4)); E('E4', ...tr(2, 3));
T('T1', ...tl(0, 4)); T('T2', ...tl(1, 4)); T('T4', ...tl(2, 4));

// Inject descriptions under the panels
const ly = rowTop(4) + RH + 70;
rect(40, ly, W - 80, 104, { fill: C.panel, stroke: C.line });
text(60, ly + 32, 'Qué se inyecta en cada punto', 20, 'bold', C.ink);
text(60, ly + 62, 'E1 credencial del rol usada desde otro origen (Exp. 1) · E2 pod no declarado hacia Redis y salida a Internet (Exp. 2) · E3 exclusión de logs, alerta apagada e inyección de instrucciones en el título de un libro (Exp. 3)', 18, 'normal', C.mute);
text(60, ly + 88, 'E4 sobrescritura y borrado de los comprobantes del flujo (Exp. 4, grupal) · T1 CloudTrail · T2 Cloud Logging · T3 Cloud Monitoring (reglas gd3) · T4 policy-action y auditoría de GKE', 18, 'normal', C.mute);

// Results strip
const ry = ly + 130;
const chips = [
  ['Exp. 1 · identidad · Neithan', 'R0 sin alarma → R1 MTTD 155 s, MTTC 17 s, cobertura 2/4', C.aws],
  ['Exp. 2 · segmentación · Daniela', 'R0 0/3 → R1 MTTD 22 s, MTTC 114 s, cobertura 3/3', C.k8s],
  ['Exp. 3 · telemetría + IA · Phol', 'R0 sin señal → R1 MTTD 22 s, MTTC 79 s, cobertura 3/3', C.gcp],
  ['Exp. 4 · datos · grupal', 'R0 RTO 34 m 35 s → R1 principal 0, copia 22 m 49 s', C.green],
];
const cw = (W - 80 - 3 * 20) / 4;
chips.forEach(([t, s, col], i) => {
  const x = 40 + i * (cw + 20);
  rect(x, ry, cw, 110, { fill: '#fff', stroke: col, sw: 2.5 });
  text(x + 16, ry + 36, t, 20, 'bold', C.ink);
  text(x + 16, ry + 70, s.length > 58 ? s.slice(0, s.lastIndexOf(' ', 58)) : s, 16, 'normal', C.mute);
  if (s.length > 58) text(x + 16, ry + 92, s.slice(s.lastIndexOf(' ', 58) + 1), 16, 'normal', C.mute);
});
parts.push('</svg>');
writeFileSync(out, parts.join('\n'), 'utf8');
console.log(`escrito ${out} (${W}x${H})`);
