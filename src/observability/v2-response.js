import { trace } from '@opentelemetry/api';

const getOtelContext = (req) => {
  const spanContext = trace.getActiveSpan()?.spanContext();

  return (
    spanContext || {
      traceId:
        req.headers['trace-id'] ||
        req.headers['otel-trace-id'] ||
        req.headers.traceparent?.split('-')[1],
      spanId: req.headers['span-id'] || req.headers.spanid,
    }
  );
};

export const withV2Metadata = (req, body) => {
  const { traceId, spanId } = getOtelContext(req);

  return {
    ...body,
    api: 'biblio-express',
    version: '2.0.0',
    'x-trace_id': req.traceId,
    'trace-id': traceId,
    'span-id': spanId,
  };
};