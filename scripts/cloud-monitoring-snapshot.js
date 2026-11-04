import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile } from 'node:fs/promises';
import {
  distributionAggregation,
  latestDistributionMean,
  percentileFromCombinedDistributions,
} from './cloud-monitoring-distributions.js';

const execFileAsync = promisify(execFile);
const [start, end, outputPath] = process.argv.slice(2);
const projectId = process.env.PROJECT_ID;

if (!start || !end || !outputPath || !projectId) {
  console.error(
    'Cloud Monitoring snapshot requires start, end, outputPath and PROJECT_ID.',
  );
  process.exit(3);
}

const tokenResult = await execFileAsync('gcloud', [
  'auth',
  'print-access-token',
  '--quiet',
]);
const accessToken = tokenResult.stdout.trim();

if (!accessToken) {
  throw new Error('gcloud returned no access token for Cloud Monitoring.');
}

const windowSeconds = Math.max(1, Math.ceil(Number(end) - Number(start)));
const interval = {
  startTime: new Date(Number(start) * 1000).toISOString(),
  endTime: new Date(Number(end) * 1000).toISOString(),
};

const MAX_MONITORING_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1000];
const METRICS_POLL_TIMEOUT_MS = 125_000;
const METRICS_POLL_INTERVAL_MS = 10_000;

const monitoringRequest = async (path, params = {}) => {
  const url = new URL(
    `https://monitoring.googleapis.com/v3/projects/${projectId}/${path}`,
  );
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(name, value);
    }
  }

  for (let attempt = 1; attempt <= MAX_MONITORING_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        return response.json();
      }

      const message = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === MAX_MONITORING_ATTEMPTS) {
        throw new Error(
          `Cloud Monitoring API failed (${response.status}): ${message}`,
        );
      }
    } catch (error) {
      if (
        attempt === MAX_MONITORING_ATTEMPTS ||
        (error instanceof Error && error.message.includes('API failed ('))
      ) {
        throw error;
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]),
    );
  }
};

const listTimeSeries = async (filter, aggregation = {}) => {
  const values = [];
  let pageToken;

  do {
    const body = await monitoringRequest('timeSeries', {
      filter,
      'interval.startTime': interval.startTime,
      'interval.endTime': interval.endTime,
      'aggregation.alignmentPeriod': `${windowSeconds}s`,
      ...Object.fromEntries(
        Object.entries(aggregation).map(([key, value]) => [
          `aggregation.${key}`,
          value,
        ]),
      ),
      pageSize: '1000',
      pageToken,
    });
    values.push(...(body.timeSeries ?? []));
    pageToken = body.nextPageToken;
  } while (pageToken);

  return values;
};

const listAvailableTimeSeries = async (
  filter,
  aggregation,
  metricDescription,
) => {
  const deadline = Date.now() + METRICS_POLL_TIMEOUT_MS;
  let lastSeries = [];

  while (true) {
    lastSeries = await listTimeSeries(filter, aggregation);
    if (lastSeries.some((series) => (series.points ?? []).length > 0)) {
      return lastSeries;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(
        `Cloud Monitoring metrics unavailable after ${METRICS_POLL_TIMEOUT_MS}ms: ${metricDescription}. ` +
          'No time-series points were published for this track and metric.',
      );
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(METRICS_POLL_INTERVAL_MS, remaining)),
    );
  }
};

const pointValues = (series) =>
  series.flatMap((item) => item.points ?? []).map((point) => point.value);

const numberFromValue = (value) =>
  Number(value?.doubleValue ?? value?.int64Value ?? value?.boolValue);

const sum = (series) =>
  pointValues(series).reduce((total, value) => total + numberFromValue(value), 0);

const serviceFilter = (service, metricType, extra = '') =>
  `metric.type = "${metricType}" AND resource.type = "cloud_run_revision" AND resource.labels.service_name = "${service}"${extra}`;

const services = {
  stable: process.env.STABLE_SERVICE ?? 'biblio-express-demo-stable',
  canary: process.env.CANARY_SERVICE ?? 'biblio-express-demo-canary',
};

const metricTypes = {
  requests: 'run.googleapis.com/request_count',
  latency: 'run.googleapis.com/request_latencies',
  cpu: 'run.googleapis.com/container/cpu/utilizations',
  memory: 'run.googleapis.com/container/memory/usage',
};

const queryTrack = async (track, service) => {
  const requests = await listAvailableTimeSeries(
    serviceFilter(service, metricTypes.requests),
    { perSeriesAligner: 'ALIGN_SUM' },
    `${track} (${service}) ${metricTypes.requests}`,
  );
  const errors4xx = await listTimeSeries(
    serviceFilter(
      service,
      metricTypes.requests,
      ' AND metric.labels.response_code_class = "4xx"',
    ),
    { perSeriesAligner: 'ALIGN_SUM' },
  );
  const errors5xx = await listTimeSeries(
    serviceFilter(
      service,
      metricTypes.requests,
      ' AND metric.labels.response_code_class = "5xx"',
    ),
    { perSeriesAligner: 'ALIGN_SUM' },
  );

  const latency = {};
  const latencySeries = await listAvailableTimeSeries(
    serviceFilter(service, metricTypes.latency),
    distributionAggregation,
    `${track} (${service}) ${metricTypes.latency}`,
  );
  for (const percentile of [50, 95, 99]) {
    latency[`p${percentile}`] = percentileFromCombinedDistributions(
      latencySeries,
      percentile,
    );
  }

  const cpu = await listAvailableTimeSeries(
    serviceFilter(service, metricTypes.cpu),
    distributionAggregation,
    `${track} (${service}) ${metricTypes.cpu}`,
  );
  const memory = await listAvailableTimeSeries(
    serviceFilter(service, metricTypes.memory),
    distributionAggregation,
    `${track} (${service}) ${metricTypes.memory}`,
  );

  const counters = {
    requests: Math.round(sum(requests)),
    errors4xx: Math.round(sum(errors4xx)),
    errors5xx: Math.round(sum(errors5xx)),
  };
  if (
    !Number.isFinite(counters.requests) ||
    !Number.isFinite(counters.errors4xx) ||
    !Number.isFinite(counters.errors5xx)
  ) {
    throw new Error(`Cloud Monitoring returned invalid counters for ${track}.`);
  }

  return {
    ...counters,
    p50LatencyMs: latency.p50,
    p95LatencyMs: latency.p95,
    p99LatencyMs: latency.p99,
    cpuUtilization: latestDistributionMean(cpu),
    memoryBytes: latestDistributionMean(memory),
    track,
  };
};

const stable = await queryTrack('stable', services.stable);
const canary = await queryTrack('canary', services.canary);

for (const [track, sample] of Object.entries({ stable, canary })) {
  if (
    !Number.isFinite(sample.p50LatencyMs) ||
    !Number.isFinite(sample.p95LatencyMs) ||
    !Number.isFinite(sample.p99LatencyMs) ||
    !Number.isFinite(sample.cpuUtilization) ||
    !Number.isFinite(sample.memoryBytes)
  ) {
    throw new Error(`Cloud Monitoring returned incomplete metrics for ${track}.`);
  }
}

const snapshot = {
  stable: {
    ...stable,
    windowStart: interval.startTime,
    windowEnd: interval.endTime,
  },
  canary: {
    ...canary,
    windowStart: interval.startTime,
    windowEnd: interval.endTime,
  },
  source: {
    provider: 'google-cloud-monitoring',
    projectId,
    windowSeconds,
    latencyAggregation: 'ALIGN_SUM+REDUCE_SUM',
    latencyPercentileMethod: 'combined_distribution_linear_interpolation',
    cpuAggregation: 'ALIGN_SUM+REDUCE_SUM',
    memoryAggregation: 'ALIGN_SUM+REDUCE_SUM',
  },
};

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify(snapshot, null, 2));
