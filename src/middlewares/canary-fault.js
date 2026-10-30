import { timingSafeEqual } from 'node:crypto';

const isAuthorized = (providedToken, expectedToken) => {
  if (!providedToken || !expectedToken) {
    return false;
  }

  const provided = Buffer.from(providedToken);
  const expected = Buffer.from(expectedToken);

  return (
    provided.length === expected.length &&
    timingSafeEqual(provided, expected)
  );
};

export const canaryFault = async (req, res, next) => {
  // Nunca inyectar fallos fuera de canary.
  if (process.env.APP_TRACK !== 'canary') {
    return next();
  }

  // Desactivado por defecto.
  if (process.env.CANARY_FAULTS_ENABLED !== 'true') {
    return next();
  }

  const fault = req.get('x-canary-fault');

  if (!fault) {
    return next();
  }

  const expectedToken = process.env.CANARY_FAULT_TOKEN;
  const providedToken = req.get('x-canary-fault-token');

  if (!isAuthorized(providedToken, expectedToken)) {
    return res.status(403).json({
      message: 'Unauthorized fault injection',
    });
  }

  if (fault === 'latency') {
    const configuredDelay = Number(
      process.env.CANARY_FAULT_LATENCY_MS ?? 2000,
    );

    const delayMs = Number.isFinite(configuredDelay)
      ? Math.min(Math.max(configuredDelay, 100), 5000)
      : 2000;

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return next();
  }

  if (fault === 'error') {
    return res.status(500).json({
      message: 'Controlled canary fault injection',
    });
  }

  return res.status(400).json({
    message: 'Unsupported canary fault type',
  });
};
