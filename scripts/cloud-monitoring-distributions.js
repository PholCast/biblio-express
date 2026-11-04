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

