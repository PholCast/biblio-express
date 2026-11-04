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

