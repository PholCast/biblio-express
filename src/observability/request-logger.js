import { logs } from '@opentelemetry/api-logs';
import { trace } from '@opentelemetry/api';

const logger = logs.getLogger('biblio-api-azure');

export const requestLogger = (req, res, next) => {
  if (!req.originalUrl.startsWith('/api/v2') && 
      !req.originalUrl.startsWith('/api/v3')) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - start) / 1_000_000;

    const span = trace.getActiveSpan();
    const spanContext = span?.spanContext();

    logger.emit({
      severityText: res.statusCode >= 500 ? 'ERROR' : 'INFO',
      body: 'HTTP request completed',
      attributes: {
        method: req.method,
        path: req.originalUrl,
        status_code: res.statusCode,
        duration_ms: durationMs,
        trace_id: spanContext?.traceId,
        span_id: spanContext?.spanId,
      },
    });
  });

  next();
};