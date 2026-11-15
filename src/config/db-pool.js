import 'dotenv/config';
import pg from 'pg';

const toNonNegativeInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

export const poolConfig = {
  // Tamaño máximo del pool: es el recurso que agota el experimento de caos.
  max: toNonNegativeInt(process.env.DB_POOL_MAX, 10) || 10,

  // Tiempo máximo esperando una conexión libre. 0 = sin límite: la petición
  // espera indefinidamente (configuración inicial, sin protección).
  // El mismo límite cubre abrir una conexión nueva, así que debe superar con
  // holgura el tiempo de conexión a la base de datos.
  acquireTimeoutMs: toNonNegativeInt(
    process.env.DB_POOL_ACQUIRE_TIMEOUT_MS,
    0,
  ),
};

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolConfig.max,
  connectionTimeoutMillis: poolConfig.acquireTimeoutMs,
});

pool.on('error', (error) => {
  console.error('Idle database client error:', error.message);
});
