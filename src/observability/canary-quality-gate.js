export const evaluateCanary = (snapshot, slo) => {
  const pause = (reason) => ({
    decision: 'pause',
    reason,
  });

  const abort = (reason) => ({
    decision: 'abort',
    reason,
  });

  // Validar la configuración de los SLO.
  if (
    !slo ||
    !Number.isFinite(slo.windowSeconds) ||
    slo.windowSeconds <= 0 ||
    !Number.isInteger(slo.minimumRequestsPerTrack) ||
    slo.minimumRequestsPerTrack <= 0 ||
    !Number.isFinite(slo.max5xxRate) ||
    slo.max5xxRate < 0 ||
    slo.max5xxRate > 1 ||
    !Number.isFinite(slo.max4xxRateIncrease) ||
    slo.max4xxRateIncrease < 0 ||
    slo.max4xxRateIncrease > 1 ||
    !Number.isFinite(slo.maxP95LatencyMs) ||
    slo.maxP95LatencyMs <= 0 ||
    !Number.isFinite(slo.maxP95RegressionPercent) ||
    slo.maxP95RegressionPercent < 0 ||
    !Number.isFinite(slo.minP95RegressionMs) ||
    slo.minP95RegressionMs < 0
  ) {
    return pause('Invalid SLO configuration');
  }

  const stable = snapshot?.stable;
  const canary = snapshot?.canary;

  if (!stable || !canary) {
    return pause('Missing stable or canary metrics');
  }

  if (
    !stable.windowStart ||
    !stable.windowEnd ||
    stable.windowStart !== canary.windowStart ||
    stable.windowEnd !== canary.windowEnd
  ) {
    return pause(
      'Stable and canary must use the same observation window',
    );
  }

  const windowStart = Date.parse(stable.windowStart);
  const windowEnd = Date.parse(stable.windowEnd);

  if (
    !Number.isFinite(windowStart) ||
    !Number.isFinite(windowEnd) ||
    windowEnd <= windowStart
  ) {
    return pause('Invalid observation window');
  }

  const actualWindowSeconds = (windowEnd - windowStart) / 1000;

  if (actualWindowSeconds < slo.windowSeconds) {
    return pause('Observation window is too short');
  }

  for (const [name, sample] of Object.entries({ stable, canary })) {
    if (
      !Number.isSafeInteger(sample.requests) ||
      !Number.isSafeInteger(sample.errors4xx) ||
      !Number.isSafeInteger(sample.errors5xx) ||
      sample.requests <= 0 ||
      sample.errors4xx < 0 ||
      sample.errors5xx < 0 ||
      sample.errors4xx + sample.errors5xx > sample.requests ||
      !Number.isFinite(sample.p95LatencyMs) ||
      sample.p95LatencyMs < 0
    ) {
      return pause(`Invalid metrics for ${name}`);
    }
  }

  if (
    stable.requests < slo.minimumRequestsPerTrack ||
    canary.requests < slo.minimumRequestsPerTrack
  ) {
    return pause('Insufficient request volume for a decision');
  }

  const stable5xxRate = stable.errors5xx / stable.requests;
  const canary5xxRate = canary.errors5xx / canary.requests;
  const stable4xxRate = stable.errors4xx / stable.requests;
  const canary4xxRate = canary.errors4xx / canary.requests;

  // Primero comprobar los límites absolutos del canary.
  if (
    canary5xxRate > slo.max5xxRate ||
    canary.p95LatencyMs > slo.maxP95LatencyMs
  ) {
    return abort(
      'Canary violates an absolute error or latency threshold',
    );
  }

  if (canary4xxRate > stable4xxRate + slo.max4xxRateIncrease) {
    return abort(
      'Canary 4xx rate exceeds the stable baseline beyond the allowed increase',
    );
  }

  // Después comprobar si la versión estable sirve como baseline.
  if (
    stable5xxRate > slo.max5xxRate ||
    stable.p95LatencyMs > slo.maxP95LatencyMs
  ) {
    return pause(
      'Stable baseline is unhealthy; comparison is inconclusive',
    );
  }
  const maxAllowedP95 =
    stable.p95LatencyMs *
    (1 + slo.maxP95RegressionPercent / 100);

  if (
    canary.p95LatencyMs > maxAllowedP95 &&
    canary.p95LatencyMs - stable.p95LatencyMs > slo.minP95RegressionMs
  ) {
    return abort(
      'Canary p95 latency regressed beyond the allowed baseline',
    );
  }

  return {
    decision: 'promote',
    reason: 'SLO thresholds passed with sufficient comparable traffic',
    metrics: {
      stable5xxRate,
      canary5xxRate,
      stable4xxRate,
      canary4xxRate,
      stableP50LatencyMs: stable.p50LatencyMs,
      canaryP50LatencyMs: canary.p50LatencyMs,
      stableP95LatencyMs: stable.p95LatencyMs,
      canaryP95LatencyMs: canary.p95LatencyMs,
      stableP99LatencyMs: stable.p99LatencyMs,
      canaryP99LatencyMs: canary.p99LatencyMs,
      stableCpuUtilization: stable.cpuUtilization,
      canaryCpuUtilization: canary.cpuUtilization,
      stableMemoryBytes: stable.memoryBytes,
      canaryMemoryBytes: canary.memoryBytes,
      stableRequests: stable.requests,
      canaryRequests: canary.requests,
    },
  };
};