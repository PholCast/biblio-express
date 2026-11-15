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
