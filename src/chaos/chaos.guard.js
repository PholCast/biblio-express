import { timingSafeEqual } from 'node:crypto';

const tokenMatches = (providedToken, expectedToken) => {
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

// Interruptor maestro: sin CHAOS_ENABLED=true las rutas de caos no existen.
// Con el interruptor encendido, cada orden exige la cabecera x-chaos-token.
export const chaosGuard = (req, res, next) => {
  if (process.env.CHAOS_ENABLED !== 'true') {
    return res.status(404).json({
      message: 'Not found',
    });
  }

  if (!tokenMatches(req.get('x-chaos-token'), process.env.CHAOS_TOKEN)) {
    return res.status(403).json({
      message: 'Unauthorized chaos request',
    });
  }

  return next();
};
