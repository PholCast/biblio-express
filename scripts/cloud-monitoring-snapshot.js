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

