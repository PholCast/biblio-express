import { monitorEventLoopDelay } from 'node:perf_hooks';
import { metrics } from '@opentelemetry/api';
import { pool, poolConfig } from '../config/db-pool.js';
import { FAULT_NAME, getChaosStatus } from '../chaos/pool-exhaustion.js';

const meter = metrics.getMeter('biblio-resources');

const attributes = {
  app_version: process.env.APP_VERSION || 'unknown',
  app_track: process.env.APP_TRACK || 'unknown',
};

const gauge = (name, description, unit, read) => {
  meter
    .createObservableGauge(name, { description, unit })
    .addCallback((result) => result.observe(read(), attributes));
};

// Pool de conexiones: el recurso que agota el experimento de caos.
gauge(
  'biblio.db.pool.max',
  'Tamaño máximo configurado del pool de conexiones',
  '{connection}',
  () => poolConfig.max,
);

gauge(
  'biblio.db.pool.total',
  'Conexiones abiertas por el pool',
  '{connection}',
  () => pool.totalCount,
);

gauge(
  'biblio.db.pool.idle',
  'Conexiones libres en el pool',
  '{connection}',
  () => pool.idleCount,
);

gauge(
  'biblio.db.pool.waiting',
  'Peticiones en cola esperando una conexión del pool',
  '{request}',
  () => pool.waitingCount,
);

// Ventana de inyección: 1 mientras el fallo está activo, 0 en otro caso.
meter
  .createObservableGauge('biblio.chaos.active', {
    description: 'Indica si hay un fallo de caos activo',
    unit: '1',
  })
  .addCallback((result) => {
    const status = getChaosStatus();

    result.observe(status.active ? 1 : 0, {
      ...attributes,
      fault: FAULT_NAME,
    });
  });

gauge(
  'biblio.chaos.held_connections',
  'Conexiones retenidas por el fallo de agotamiento del pool',
  '{connection}',
  () => getChaosStatus().heldConnections,
);

const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
eventLoopDelay.enable();

gauge(
  'biblio.runtime.eventloop.delay.p99',
  'Retraso p99 del event loop desde la última lectura',
  'ms',
  () => {
    const p99 = eventLoopDelay.percentile(99) / 1_000_000;
    eventLoopDelay.reset();

    return p99;
  },
);

const resilienceEvents = meter.createCounter('biblio.resilience.events', {
  description: 'Activaciones de los patrones de resiliencia',
  unit: '{event}',
});

export const recordResilienceEvent = (pattern, entity) => {
  resilienceEvents.add(1, { ...attributes, pattern, entity });
};
