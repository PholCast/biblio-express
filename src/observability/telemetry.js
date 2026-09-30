import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

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

console.log('OpenTelemetry initialized');