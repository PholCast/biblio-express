const endpoint = process.argv[2];
const canaryPercent = Number(process.argv[3]);
const targetPerTrack = Number(process.argv[4] ?? 100);
const concurrency = Number(process.argv[5] ?? 20);
const maxSeconds = Number(process.argv[6] ?? 120);

if (
  !endpoint ||
  !Number.isInteger(canaryPercent) ||
  canaryPercent < 0 ||
  canaryPercent > 100 ||
  !Number.isInteger(targetPerTrack) ||
  targetPerTrack <= 0 ||
  !Number.isInteger(concurrency) ||
  concurrency <= 0 ||
  !Number.isInteger(maxSeconds) ||
  maxSeconds <= 0
) {
  console.error(
    'Usage: node scripts/canary-load.js <url> <canaryPercent> <targetPerTrack> <concurrency> <maxSeconds>',
  );
  process.exit(3);
}

const counts = { stable: 0, canary: 0, unknown: 0 };
const deadline = Date.now() + maxSeconds * 1000;
const url = `${endpoint.replace(/\/$/, '')}/api/v3/books`;
const REQUEST_TIMEOUT_MS = 10_000;

const request = async () => {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) {
    counts.unknown += 1;
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.min(REQUEST_TIMEOUT_MS, remainingMs),
  );

  try {
    const response = await fetch(url, { signal: controller.signal });
    const track = response.headers.get('x-app-track');
    if (
      response.status >= 200 &&
      response.status < 300 &&
      (track === 'stable' || track === 'canary')
    ) {
      counts[track] += 1;
    } else {
      counts.unknown += 1;
    }
  } catch {
    counts.unknown += 1;
  } finally {
    clearTimeout(timeout);
  }
};

const worker = async () => {
  while (Date.now() < deadline) {
    const requiredStable = canaryPercent === 100 ? 0 : targetPerTrack;
    const requiredCanary = canaryPercent === 0 ? 0 : targetPerTrack;

    if (
      counts.stable >= requiredStable &&
      counts.canary >= requiredCanary
    ) {
      return;
    }

    await request();
  }
};

await Promise.all(
  Array.from({ length: concurrency }, () => worker()),
);

const result = {
  endpoint: url,
  canaryPercent,
  targetPerTrack,
  concurrency,
  maxSeconds,
  counts,
  complete:
    counts.stable >= (canaryPercent === 100 ? 0 : targetPerTrack) &&
    counts.canary >= (canaryPercent === 0 ? 0 : targetPerTrack),
};

console.log(JSON.stringify(result, null, 2));
if (!result.complete) {
  process.exitCode = 1;
}
