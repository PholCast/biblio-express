import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { metrics } from '@opentelemetry/api';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),

  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),

  logRecordProcessor: new SimpleLogRecordProcessor({
    exporter: new OTLPLogExporter(),
  }),

  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (request) =>
            request.url?.split('?')[0] === '/health',
        applyCustomAttributesOnSpan: (span, request) => {
          const route = request.route?.path;

          if (route) {
            const base =
              request.baseUrl && request.baseUrl !== '/'
                ? request.baseUrl
                : '';

            const fullRoute = `${base}${route}`;

            span.setAttribute('http.route', fullRoute);
            span.updateName(`${request.method} ${fullRoute}`);
          }
        },
      },

      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
    }),
  ],
});

sdk.start();


const runtimeMeter = metrics.getMeter('biblio-runtime');

const runtimeAttributes = {
  app_version: process.env.APP_VERSION || 'unknown',
  app_track: process.env.APP_TRACK || 'unknown',
};

const rssGauge = runtimeMeter.createObservableGauge(
  'biblio.process.memory.rss',
  {
    description: 'Memoria residente utilizada por el proceso Node.js',
    unit: 'By',
  },
);

const heapGauge = runtimeMeter.createObservableGauge(
  'biblio.process.memory.heap_used',
  {
    description: 'Memoria heap utilizada por Node.js',
    unit: 'By',
  },
);

const cpuGauge = runtimeMeter.createObservableGauge(
  'biblio.process.cpu.utilization',
  {
    description: 'Tiempo de CPU consumido por el proceso Node.js dividido por el tiempo transcurrido; puede superar 1 si utiliza varios núcleos',
    unit: '1',
  },
);

let previousCpu = process.cpuUsage();
let previousTime = process.hrtime.bigint();

rssGauge.addCallback((result) => {
  result.observe(process.memoryUsage().rss, runtimeAttributes);
});

heapGauge.addCallback((result) => {
  result.observe(process.memoryUsage().heapUsed, runtimeAttributes);
});

cpuGauge.addCallback((result) => {
  const now = process.hrtime.bigint();
  const elapsedMicros = Number(now - previousTime) / 1_000;

  const currentCpu = process.cpuUsage();

  const cpuMicros =
    currentCpu.user - previousCpu.user +
    currentCpu.system - previousCpu.system;

  previousCpu = currentCpu;
  previousTime = now;

  if (elapsedMicros > 0) {
    result.observe(cpuMicros / elapsedMicros, runtimeAttributes);
  }
});


console.log('OpenTelemetry initialized');