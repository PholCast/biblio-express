import crypto from 'node:crypto';

export const traceContext = (req, res, next) => {
  const incomingTraceId = req.headers['x-trace-id'];

  const traceId = incomingTraceId || crypto.randomUUID();

  req.traceId = traceId;

  res.setHeader('x-trace-id', traceId);

  next();
};