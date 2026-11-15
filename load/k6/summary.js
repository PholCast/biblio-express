// Convierte el resumen de k6 en un JSON pequeño con las métricas por fase:
// línea base, ventana de inyección y recuperación.

const metricValues = (data, name) => data.metrics[name]?.values ?? {};

const phaseSummary = (data, phase) => {
  const failed = metricValues(data, `http_req_failed{phase:${phase}}`);
  const duration = metricValues(data, `http_req_duration{phase:${phase}}`);
  const requests = metricValues(data, `http_reqs{phase:${phase}}`);

  return {
    requests: requests.count ?? 0,
    errorRate: failed.rate ?? null,
    successRate: failed.rate === undefined ? null : 1 - failed.rate,
    latencyMs: {
      avg: duration.avg ?? null,
      p95: duration['p(95)'] ?? null,
      p99: duration['p(99)'] ?? null,
      max: duration.max ?? null,
    },
  };
};

const thresholdResults = (data) => {
  const results = {};

  for (const [name, metric] of Object.entries(data.metrics)) {
    for (const [expression, result] of Object.entries(
      metric.thresholds ?? {},
    )) {
      results[`${name}: ${expression}`] = result.ok;
    }
  }

  return results;
};

export const buildSummary = (data, context) => {
  const phases = {};

  for (const phase of context.phases) {
    phases[phase] = phaseSummary(data, phase);
  }

  return {
    generatedAt: new Date().toISOString(),
    round: context.round,
    experiment: context.experiment,
    profile: context.profile.name,
    target: {
      baseUrl: context.baseUrl,
      paths: context.flowPaths,
    },
    faultWindow: context.profile.faultWindow,
    testDurationMs: data.state.testRunDurationMs,
    phases,
    thresholds: thresholdResults(data),
  };
};
