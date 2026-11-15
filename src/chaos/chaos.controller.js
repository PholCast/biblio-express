import { poolConfig } from '../config/db-pool.js';
import {
  MAX_DURATION_SECONDS,
  getChaosStatus,
  startPoolExhaustion,
  stopPoolExhaustion,
} from './pool-exhaustion.js';

const DEFAULT_DURATION_SECONDS = 120;

const readInt = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return Number(value);
};

const isBetween = (value, min, max) =>
  Number.isInteger(value) && value >= min && value <= max;

export const getChaosStatusController = (req, res) => {
  return res.status(200).json(getChaosStatus());
};

export const startPoolExhaustionController = async (req, res) => {
  const params = { ...req.query, ...(req.body ?? {}) };

  const hold = readInt(params.hold, poolConfig.max);
  const durationSeconds = readInt(
    params.durationSeconds,
    DEFAULT_DURATION_SECONDS,
  );

  if (!isBetween(hold, 1, poolConfig.max)) {
    return res.status(400).json({
      message: `hold must be an integer between 1 and ${poolConfig.max}`,
    });
  }

  if (!isBetween(durationSeconds, 1, MAX_DURATION_SECONDS)) {
    return res.status(400).json({
      message: `durationSeconds must be an integer between 1 and ${MAX_DURATION_SECONDS}`,
    });
  }

  const { started, status } = await startPoolExhaustion({
    hold,
    durationSeconds,
  });

  if (!started) {
    return res.status(409).json({
      message: 'Chaos fault already active',
      ...status,
    });
  }

  return res.status(202).json(status);
};

export const stopPoolExhaustionController = (req, res) => {
  return res.status(200).json(stopPoolExhaustion('manual'));
};
