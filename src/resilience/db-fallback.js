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
