import { resilienceConfig } from './resilience.config.js';
import { rememberFresh, recallStale } from './stale-cache.js';
import { logEvent } from '../observability/app-logger.js';
import { recordResilienceEvent } from '../observability/resource-metrics.js';

const UNAVAILABLE_MESSAGE =
  /timeout exceeded when trying to connect|connection terminated|too many clients|ECONNREFUSED|ETIMEDOUT/i;

const UNAVAILABLE_CODES = new Set([
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
  'ECONNREFUSED',
  'ETIMEDOUT',
  '53300',
  '57P01',
]);

const reasonOf = (error) =>
  String(error?.message ?? error).trim().split('\n').pop();

// Reconoce los errores de "la base de datos no pudo atender la petición"
// (pool sin conexiones libres, conexión caída), también si vienen envueltos.
export const isDbUnavailable = (error) => {
  for (let current = error, depth = 0; current && depth < 5; depth += 1) {
    if (
      UNAVAILABLE_CODES.has(current.code) ||
      UNAVAILABLE_MESSAGE.test(String(current.message ?? ''))
    ) {
      return true;
    }

    current = current.cause;
  }

  return false;
};

// Ejecuta la lectura a base de datos. Si la BD no responde y existe una
// copia reciente, la devuelve marcada como degradada (stale-if-error).
export const loadWithStaleFallback = async (req, res, key, loader) => {
  const entity = key.split(':')[0];

  try {
    const value = await loader();

    if (value !== null && value !== undefined) {
      rememberFresh(key, value);
    }

    return { value, degraded: false };
  } catch (error) {
    if (!isDbUnavailable(error)) {
      throw error;
    }

    recordResilienceEvent('db_unavailable', entity);

    const stale = recallStale(key);

    if (!stale) {
      throw error;
    }

    recordResilienceEvent('stale_cache', entity);
    res.setHeader('X-Degraded', 'stale-cache');
    res.locals.degraded = true;

    logEvent('degraded_response', {
      severity: 'WARNING',
      message: 'Serving stale response: database unavailable',
      req,
      cache_key: key,
      stale_age_ms: stale.ageMs,
      reason: reasonOf(error),
    });

    return { value: stale.value, degraded: true };
  }
};

// Respuesta de error de los controladores: 503 con Retry-After cuando la
// causa es la base de datos, 500 para cualquier otro error.
export const sendDbError = (req, res, error, message) => {
  if (!isDbUnavailable(error)) {
    return res.status(500).json({ message });
  }

  logEvent('db_unavailable', {
    severity: 'ERROR',
    message: 'Database unavailable: no stale copy to serve',
    req,
    reason: reasonOf(error),
  });

  res.setHeader('Retry-After', String(resilienceConfig.retryAfterSeconds));

  return res.status(503).json({
    message: 'Database temporarily unavailable',
  });
};
