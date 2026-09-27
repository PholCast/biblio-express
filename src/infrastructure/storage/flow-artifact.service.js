import { uploadFlowArtifact } from './blob-storage.service.js';
import { trace } from '@opentelemetry/api';


export const sendResponseWithArtifact = async ({
  req,
  res,
  entity,
  id,
  body,
  statusCode = 200,
}) => {
  const traceId = req.traceId;
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();

  const otelTraceId = spanContext?.traceId;
  const spanId = spanContext?.spanId;
  const traceparent = req.headers['traceparent'];

  try {
    await uploadFlowArtifact({
      entity,
      id,
      traceId,
      otelTraceId,
      spanId,
      traceparent,
      request: {
        method: req.method,
        path: req.originalUrl,
        'x-trace-id': traceId,
      },
      response: {
        statusCode,
        body,
      },
    });
  } catch (error) {
    console.error('Blob Storage error:', error);
  }

  return res.status(statusCode).json(body);
};