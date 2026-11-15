const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Los patrones de resiliencia se activan por variable de entorno para que
// Ronda 0 (sin protección) y Ronda 1 (protegida) usen la misma imagen.
export const resilienceConfig = {
  staleCacheEnabled: process.env.STALE_CACHE_ENABLED === 'true',

  staleCacheTtlMs:
    toPositiveInt(process.env.STALE_CACHE_TTL_SECONDS, 300) * 1000,

  staleCacheMaxEntries: toPositiveInt(
    process.env.STALE_CACHE_MAX_ENTRIES,
    500,
  ),

  retryAfterSeconds: toPositiveInt(process.env.DB_RETRY_AFTER_SECONDS, 5),
};
