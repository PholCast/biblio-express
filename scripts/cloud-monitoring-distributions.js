const pointTimestamp = (point) =>
  Date.parse(point.interval?.endTime ?? point.interval?.startTime ?? '');

const distributionValues = (series) =>
  series.flatMap((item) =>
    (item.points ?? [])
      .map((point) => point.value?.distributionValue)
      .filter(Boolean),
  );

const validateBucketCounts = (distribution, expectedLength) => {
  const counts = distribution.bucketCounts ?? [];
  if (counts.length > expectedLength) {
    throw new Error('Cloud Monitoring returned too many bucket counts.');
  }

  const normalized = [...counts, ...Array(expectedLength - counts.length).fill(0)];
  if (
    normalized.some(
      (count) => !Number.isInteger(Number(count)) || Number(count) < 0,
    )
  ) {
    throw new Error('Cloud Monitoring returned invalid bucket counts.');
  }

  const count = Number(distribution.count);
  const sum = normalized.reduce((total, value) => total + Number(value), 0);
  if (!Number.isFinite(count) || count < 0 || sum !== count) {
    throw new Error(
      'Cloud Monitoring bucket counts do not match the distribution count.',
    );
  }

  return normalized.map(Number);
};

const bucketUpperBounds = (bucketOptions, bucketCountLength) => {
  const { explicitBuckets, linearBuckets, exponentialBuckets } =
    bucketOptions ?? {};
  const definitions = [
    explicitBuckets,
    linearBuckets,
    exponentialBuckets,
  ].filter(Boolean);

  if (definitions.length !== 1) {
    throw new Error('Cloud Monitoring returned invalid bucket options.');
  }

  if (explicitBuckets) {
    const bounds = explicitBuckets.bounds ?? [];
    if (bucketCountLength !== bounds.length + 1) {
      throw new Error('Explicit bucket count does not match its bounds.');
    }
    return bounds.concat(Infinity);
  }

  const { numFiniteBuckets, offset, width } = linearBuckets ?? {};
  if (linearBuckets) {
    if (
      !Number.isInteger(numFiniteBuckets) ||
      numFiniteBuckets < 0 ||
      !Number.isFinite(offset) ||
      !Number.isFinite(width) ||
      width <= 0 ||
      bucketCountLength !== numFiniteBuckets + 2
    ) {
      throw new Error('Linear bucket definition is invalid.');
    }
    return [
      offset,
      ...Array.from(
        { length: numFiniteBuckets },
        (_, index) => offset + width * (index + 1),
      ),
      Infinity,
    ];
  }

  const {
    numFiniteBuckets: exponentialCount,
    scale,
    growthFactor,
  } = exponentialBuckets ?? {};
  if (
    !Number.isInteger(exponentialCount) ||
    exponentialCount < 0 ||
    !Number.isFinite(scale) ||
    scale <= 0 ||
    !Number.isFinite(growthFactor) ||
    growthFactor <= 1 ||
    bucketCountLength !== exponentialCount + 2
  ) {
    throw new Error('Exponential bucket definition is invalid.');
  }
  return [
    scale,
    ...Array.from(
      { length: exponentialCount },
      (_, index) => scale * growthFactor ** (index + 1),
    ),
    Infinity,
  ];
};

const expectedBucketCount = (bucketOptions) => {
  const { explicitBuckets, linearBuckets, exponentialBuckets } =
    bucketOptions ?? {};
  if (explicitBuckets) return (explicitBuckets.bounds ?? []).length + 1;
  if (linearBuckets) return Number(linearBuckets.numFiniteBuckets) + 2;
  if (exponentialBuckets) {
    return Number(exponentialBuckets.numFiniteBuckets) + 2;
  }
  throw new Error('Cloud Monitoring returned invalid bucket options.');
};

export const latestDistributionMean = (series) => {
  const points = series
    .flatMap((item) => item.points ?? [])
    .sort((left, right) => pointTimestamp(right) - pointTimestamp(left));
  const mean = points[0]?.value?.distributionValue?.mean;
  return typeof mean === 'number' && Number.isFinite(mean) ? mean : NaN;
};

export const percentileFromCombinedDistributions = (
  series,
  percentile,
) => {
  const distributions = distributionValues(series);
  if (!distributions.length) {
    return NaN;
  }

  const first = distributions[0];
  const options = JSON.stringify(first.bucketOptions);
  if (
    distributions.some(
      (distribution) =>
        JSON.stringify(distribution.bucketOptions) !== options,
    )
  ) {
    throw new Error('Cloud Monitoring returned incompatible bucket options.');
  }

  const expectedLength = expectedBucketCount(first.bucketOptions);
  const upperBounds = bucketUpperBounds(first.bucketOptions, expectedLength);
  const combinedCounts = Array(expectedLength).fill(0);
  let totalCount = 0;

  for (const distribution of distributions) {
    const counts = validateBucketCounts(distribution, expectedLength);
    counts.forEach((value, index) => {
      combinedCounts[index] += value;
    });
    totalCount += Number(distribution.count);
  }

  const combinedCount = combinedCounts.reduce(
    (total, value) => total + value,
    0,
  );
  if (combinedCount !== totalCount || totalCount <= 0) {
    throw new Error('Combined Cloud Monitoring distributions are inconsistent.');
  }

  const target = totalCount * (percentile / 100);
  let cumulative = 0;
  for (let index = 0; index < combinedCounts.length; index += 1) {
    const count = combinedCounts[index];
    if (count > 0 && cumulative + count >= target) {
      const lower = index === 0 ? -Infinity : upperBounds[index - 1];
      const upper = upperBounds[index];
      if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
        return upper;
      }
      return lower + ((target - cumulative) / count) * (upper - lower);
    }
    cumulative += count;
  }

  return NaN;
};

export const distributionAggregation = {
  perSeriesAligner: 'ALIGN_SUM',
  crossSeriesReducer: 'REDUCE_SUM',
};
