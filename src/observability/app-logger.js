import { logs } from '@opentelemetry/api-logs';
import { trace } from '@opentelemetry/api';

const logger = logs.getLogger('biblio-events');

const withoutUndefined = (record) =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );

// Registra un evento de caos o de resiliencia en dos destinos:
// - OpenTelemetry (Grafana), correlacionado con la traza activa;
// - stdout en JSON (Cloud Logging), para las métricas basadas en logs.
export const logEvent = (
  event,
  { severity = 'INFO', message, req, ...attributes } = {},
) => {
  const spanContext = trace.getActiveSpan()?.spanContext();

  const record = withoutUndefined({
    event,
    x_trace_id: req?.traceId,
    trace_id: spanContext?.traceId,
    span_id: spanContext?.spanId,
    ...attributes,
  });

  logger.emit({
    severityText: severity,
    body: message ?? event,
    attributes: record,
  });

  console.log(
    JSON.stringify({
      severity,
      message: message ?? event,
      ...record,
    }),
  );
};
