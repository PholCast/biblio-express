import { logs } from '@opentelemetry/api-logs';
import { trace } from '@opentelemetry/api';

const logger = logs.getLogger('biblio-api');

const API_PREFIXES = [
  '/api/v2',
  '/api/v3',
  '/api/v4',
];

export const requestLogger = (req, res, next) => {
  const path = req.originalUrl.split('?')[0];

  const isApiRequest = API_PREFIXES.some(
    (prefix) =>
      path === prefix || path.startsWith(`${prefix}/`),
  ) || path === '/api' || path.startsWith('/api/');

  if (!isApiRequest) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - start) / 1_000_000;

    const spanContext = trace.getActiveSpan()?.spanContext();

    logger.emit({
      severityText: res.statusCode >= 500 ? 'ERROR' : 'INFO',
      body: 'HTTP request completed',
      attributes: {
        method: req.method,
        path: req.route?.path
          ? `${req.baseUrl || ''}${req.route.path}`
          : 'unmatched',
        status_code: res.statusCode,
        api_version: res.getHeader('X-API-Version'),
        app_version: res.getHeader('X-App-Version'),
        app_track: res.getHeader('X-App-Track'),
        duration_ms: durationMs,
        degraded: res.locals.degraded === true,
        x_trace_id: req.traceId,
        trace_id: spanContext?.traceId,
        span_id: spanContext?.spanId,
      },
    });
  });

  next();
};