import { timingSafeEqual } from 'node:crypto';

const FAULT_MODES = new Set(['error', 'latency']);

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

const faultDelayMs = () => {
  const configuredDelay = Number(
    process.env.CANARY_FAULT_LATENCY_MS ?? 2000,
  );

  return Number.isFinite(configuredDelay)
    ? Math.min(Math.max(configuredDelay, 100), 5000)
    : 2000;
};

const faultRatePercent = () => {
  const rate = Number(process.env.CANARY_FAULT_RATE ?? 25);
  return Number.isFinite(rate) ? Math.min(Math.max(rate, 0), 100) : 25;
};

const isApiRequest = (req) => {
  const path = req.originalUrl.split('?')[0];
  return path === '/api' || path.startsWith('/api/');
};

const applyFault = async (fault, res, next) => {
  if (fault === 'latency') {
    await new Promise((resolve) => setTimeout(resolve, faultDelayMs()));
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

export const canaryFault = async (req, res, next) => {
  // Nunca inyectar fallos fuera de canary.
  if (process.env.APP_TRACK !== 'canary') {
    return next();
  }

  // Desactivado por defecto.
  if (process.env.CANARY_FAULTS_ENABLED !== 'true') {
    return next();
  }

  // Modo manual: cabecera x-canary-fault con token, para pruebas puntuales.
  const fault = req.get('x-canary-fault');

  if (fault) {
    const expectedToken = process.env.CANARY_FAULT_TOKEN;
    const providedToken = req.get('x-canary-fault-token');

    if (!isAuthorized(providedToken, expectedToken)) {
      return res.status(403).json({
        message: 'Unauthorized fault injection',
      });
    }

    return applyFault(fault, res, next);
  }

  // Modo por variable: simula una regresión real en un porcentaje del
  // tráfico /api del canary, sin cabecera. /health queda excluido.
  const mode = process.env.CANARY_FAULT_MODE ?? 'none';

  if (
    FAULT_MODES.has(mode) &&
    isApiRequest(req) &&
    Math.random() * 100 < faultRatePercent()
  ) {
    return applyFault(mode, res, next);
  }

  return next();
};
