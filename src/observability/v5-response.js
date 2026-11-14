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

const normalizeBody = (body) => {
  if (Array.isArray(body) || body === null || typeof body !== 'object') {
    return { data: body };
  }

  return body;
};

export const withV5Metadata = (req, body) => {
  const { traceId, spanId } = getOtelContext(req);

  return {
    ...normalizeBody(body),
    api: 'biblio-express',
    'x-trace-id': req.traceId,
    'trace-id': traceId,
    'span-id': spanId,
  };
};

export const v5ResponseMetadata = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => originalJson(withV5Metadata(req, body));

  next();
};
