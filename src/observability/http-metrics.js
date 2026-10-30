
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('biblio-api');

const requests = meter.createCounter('biblio.http.requests', {
  description: 'Total de peticiones HTTP a la API',
  unit: '{request}',
});

const clientErrors = meter.createCounter('biblio.http.errors.4xx', {
  description: 'Peticiones HTTP que terminaron con estado 4xx',
  unit: '{request}',
});

const serverErrors = meter.createCounter('biblio.http.errors.5xx', {
  description: 'Peticiones HTTP que terminaron con estado 5xx',
  unit: '{request}',
});

const duration = meter.createHistogram('biblio.http.request.duration', {
  description: 'Duración de las peticiones HTTP',
  unit: 's',
});

const getRoute = (req) => {
  if (!req.route?.path) {
    return 'unmatched';
  }

  return `${req.baseUrl || ''}${req.route.path}` || '/';
};

export const httpMetrics = (req, res, next) => {
  const path = req.originalUrl.split('?')[0];

  const isApiRequest =
    path === '/api' || path.startsWith('/api/');

  if (!isApiRequest) {
    return next();
  }

  const start = process.hrtime.bigint();

  res.once('finish', () => {
    const durationSeconds =
      Number(process.hrtime.bigint() - start) / 1_000_000_000;

    const statusCode = res.statusCode;

    const attributes = {
      app_version: String(
        res.getHeader('X-App-Version') ??
          process.env.APP_VERSION ??
          'unknown',
      ),
      app_track: String(
        res.getHeader('X-App-Track') ??
          process.env.APP_TRACK ??
          'unknown',
      ),
      method: req.method,
      route: getRoute(req),
      status_code: statusCode,
    };

    requests.add(1, attributes);
    duration.record(durationSeconds, attributes);

    if (statusCode >= 400 && statusCode < 500) {
      clientErrors.add(1, attributes);
    } else if (statusCode >= 500) {
      serverErrors.add(1, attributes);
    }
  });

  next();
};
