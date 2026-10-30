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
    !Number.isFinite(slo.maxP95LatencyMs) ||
    slo.maxP95LatencyMs <= 0 ||
    !Number.isFinite(slo.maxP95RegressionPercent) ||
    slo.maxP95RegressionPercent < 0
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

  return {
    decision: 'pause',
    reason: 'Input validation passed; canary evaluation is pending',
  };
};
