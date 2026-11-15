import { pool, poolConfig } from '../config/db-pool.js';
import { logEvent } from '../observability/app-logger.js';

export const FAULT_NAME = 'pool-exhaustion';
export const MAX_DURATION_SECONDS = 300;

const HEARTBEAT_MS = 10_000;
const RETRY_DELAY_MS = 100;

const state = {
  active: false,
  generation: 0,
  requested: 0,
  held: [],
  startedAt: null,
  endsAt: null,
  revertTimer: null,
  heartbeat: null,
};

const ignoreClientError = () => {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getChaosStatus = () => ({
  fault: FAULT_NAME,
  active: state.active,
  requestedConnections: state.requested,
  heldConnections: state.held.length,
  startedAt: state.startedAt,
  endsAt: state.endsAt,
  pool: {
    max: poolConfig.max,
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  },
});

// Toma una conexión del pool y la retiene. Reintenta mientras el fallo siga
// activo, porque con timeout de adquisición el pool puede rechazar el intento.
const holdOneConnection = async (generation) => {
  while (state.active && state.generation === generation) {
    try {
      const client = await pool.connect();

      if (!state.active || state.generation !== generation) {
        client.release();
        return;
      }

      client.on('error', ignoreClientError);
      state.held.push(client);
      return;
    } catch {
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export const stopPoolExhaustion = (reason = 'manual') => {
  if (!state.active) {
    return getChaosStatus();
  }

  clearTimeout(state.revertTimer);
  clearInterval(state.heartbeat);

  const released = state.held.length;

  for (const client of state.held) {
    client.removeListener('error', ignoreClientError);
    client.release();
  }

  state.active = false;
  state.generation += 1;
  state.held = [];
  state.requested = 0;
  state.startedAt = null;
  state.endsAt = null;

  logEvent('chaos_fault_stopped', {
    message: 'Chaos fault stopped',
    fault: FAULT_NAME,
    reason,
    released_connections: released,
  });

  return getChaosStatus();
};

export const startPoolExhaustion = async ({ hold, durationSeconds }) => {
  if (state.active) {
    return { started: false, status: getChaosStatus() };
  }

  const generation = state.generation + 1;

  state.active = true;
  state.generation = generation;
  state.requested = hold;
  state.startedAt = new Date().toISOString();
  state.endsAt = new Date(
    Date.now() + durationSeconds * 1000,
  ).toISOString();

  // Reversión automática: libera las conexiones aunque nadie apague el fallo.
  state.revertTimer = setTimeout(
    () => stopPoolExhaustion('auto-revert'),
    durationSeconds * 1000,
  );

  state.heartbeat = setInterval(() => {
    logEvent('chaos_fault_active', {
      message: 'Chaos fault active',
      fault: FAULT_NAME,
      held_connections: state.held.length,
      pool_waiting: pool.waitingCount,
    });
  }, HEARTBEAT_MS);

  logEvent('chaos_fault_started', {
    severity: 'WARNING',
    message: 'Chaos fault started',
    fault: FAULT_NAME,
    requested_connections: hold,
    duration_seconds: durationSeconds,
  });

  // Una a una: cada toma espera su turno en el pool como cualquier petición
  // y no abre varias conexiones nuevas a la vez.
  const acquisition = (async () => {
    for (let taken = 0; taken < hold; taken += 1) {
      await holdOneConnection(generation);
    }
  })();

  // Responde cuando todas las conexiones están retenidas o tras 5 s.
  await Promise.race([acquisition, sleep(5000)]);

  return { started: true, status: getChaosStatus() };
};
