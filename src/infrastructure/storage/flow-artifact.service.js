import crypto from 'node:crypto';
import { uploadFlowArtifact } from './blob-storage.service.js';

export const sendResponseWithArtifact = async ({
  req,
  res,
  entity,
  id,
  body,
  statusCode = 200,
}) => {
  const traceId = req.headers['trace-id'] || crypto.randomUUID();

  try {
    await uploadFlowArtifact({
      entity,
      id,
      traceId,
      request: {
        method: req.method,
        path: req.originalUrl,
        traceId,
      },
      response: {
        statusCode,
        body,
      },
    });
  } catch (error) {
    console.error('Blob Storage error:', error);
  }

  return res.status(statusCode).json(body);
};