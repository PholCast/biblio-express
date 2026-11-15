import { metrics } from '@opentelemetry/api';
import { logEvent } from '../observability/app-logger.js';

const meter = metrics.getMeter('biblio-integrations');

const duration = meter.createHistogram('biblio.external.request.duration', {
  description: 'Duración de las llamadas salientes a las API de compañeros',
  unit: 's',
});

const record = (dependency, traceId, start, outcome, statusCode) => {
  const seconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;

  duration.record(seconds, { dependency, outcome });

  logEvent('external_call', {
    severity: outcome === 'ok' ? 'INFO' : 'ERROR',
    message: `External call to ${dependency}: ${outcome}`,
    req: { traceId },
    dependency,
    outcome,
    status_code: statusCode,
    duration_ms: seconds * 1000,
  });
};

// GET a la API de un compañero propagando el trace ID y midiendo la llamada.
export const fetchJson = async (dependency, url, traceId) => {
  const start = process.hrtime.bigint();
  let response;

  try {
    response = await fetch(url, {
      headers: {
        'x-trace-id': traceId,
      },
    });
  } catch (error) {
    record(dependency, traceId, start, 'network_error');
    throw error;
  }

  record(
    dependency,
    traceId,
    start,
    response.ok ? 'ok' : 'http_error',
    response.status,
  );

  if (!response.ok) {
    throw new Error(
      `${dependency} API returned status ${response.status}`,
    );
  }

  return response.json();
};
