import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { buildSummary } from './summary.js';

// Perfil común y fijo: concurrencia, duración y escalones. No se modifica
// entre rondas; lo único que cambia por integrante es el destino (entorno).
const profile = JSON.parse(open('../profile.json'));

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const FLOW_PATHS = (__ENV.FLOW_PATH || '/api/v5/books/1')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);

const ROUND = __ENV.ROUND || 'calibracion';
const EXPERIMENT = __ENV.EXPERIMENT || 'sin-experimento';

const PHASES = ['baseline', 'fault', 'recovery'];
const faultStart = profile.faultWindow.startSeconds * 1000;
const faultEnd = faultStart + profile.faultWindow.durationSeconds * 1000;

// Umbral de la métrica objetivo de cada integrante, por ejemplo:
// OBJECTIVE_METRIC='http_req_failed{phase:fault}' OBJECTIVE_EXPR='rate<=0.05'
const thresholds = {};

for (const phase of PHASES) {
  // Umbrales informativos: hacen que k6 calcule cada métrica por fase.
  thresholds[`http_req_failed{phase:${phase}}`] = ['rate>=0'];
  thresholds[`http_req_duration{phase:${phase}}`] = ['p(95)>=0'];
  thresholds[`http_reqs{phase:${phase}}`] = ['count>=0'];
}

if (__ENV.OBJECTIVE_METRIC && __ENV.OBJECTIVE_EXPR) {
  thresholds[__ENV.OBJECTIVE_METRIC] = [__ENV.OBJECTIVE_EXPR];
}

export const options = {
  scenarios: {
    flujo: {
      executor: profile.executor,
      startVUs: profile.startVUs,
      stages: profile.stages,
      gracefulRampDown: profile.gracefulRampDown,
    },
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  tags: { round: ROUND, experiment: EXPERIMENT, profile: profile.name },
};
