import crypto from 'node:crypto';
import { trace } from '@opentelemetry/api';

export const traceContext = (req, res, next) => {
  const incomingTraceId = req.headers['x-trace-id'];

  const traceId = incomingTraceId || crypto.randomUUID();

  req.traceId = traceId;

  res.setHeader('x-trace-id', traceId);

  // El identificador de correlación del flujo queda en el span para poder
  // buscar la traza por el mismo valor que viaja entre las tres API.
  trace.getActiveSpan()?.setAttribute('app.x_trace_id', traceId);

  next();
};
