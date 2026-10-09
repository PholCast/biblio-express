import { trace } from '@opentelemetry/api';
import 'dotenv/config';
import { withV2Metadata } from '../../observability/v2-response.js';

const objectStorageUrl =
  process.env.OBJECT_STORAGE_URL || 'http://object-storage:3001';

const objectStorageTimeoutMs = Number(
  process.env.OBJECT_STORAGE_TIMEOUT_MS || 5000
);

const uploadFlowArtifact = async (artifact) => {
  const headers = {
    'content-type': 'application/json',
    'x-trace-id': artifact.traceId,
  };

  if (artifact.traceparent) {
    headers.traceparent = artifact.traceparent;
  }

  const response = await fetch(`${objectStorageUrl}/artifacts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(artifact),
    signal: AbortSignal.timeout(objectStorageTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Object Storage returned status ${response.status}`
    );
  }

  return response.json();
};

const sendArtifactResponse = async ({
  req,
  res,
  entity,
  id,
  body,
  statusCode,
  version,
  responseBody,
}) => {
  const traceId = req.traceId;
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();

  try {
    await uploadFlowArtifact({
      version,
      entity,
      id,
      traceId,
      otelTraceId: spanContext?.traceId,
      spanId: spanContext?.spanId,
      traceparent: req.headers['traceparent'],
      request: {
        method: req.method,
        path: req.originalUrl,
        'x-trace-id': traceId,
      },
      response: {
        statusCode,
        body,
      },
    });
  } catch (error) {
    console.error('Blob Storage error:', error);
  }

  return res.status(statusCode).json(responseBody);
};

export const sendResponseWithArtifact = async ({
  req,
  res,
  entity,
  id,
  body,
  statusCode = 200,
}) => {
  const traceId = req.traceId;
  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();

  const otelTraceId = spanContext?.traceId;
  const spanId = spanContext?.spanId;
  const traceparent = req.headers['traceparent'];
  const responseBody = withV2Metadata(req, body);

  try {
    await uploadFlowArtifact({
      entity,
      id,
      traceId,
      otelTraceId,
      spanId,
      traceparent,
      request: {
        method: req.method,
        path: req.originalUrl,
        'x-trace-id': traceId,
      },
      response: {
        statusCode,
        body,
      },
    });
  } catch (error) {
    console.error('Blob Storage error:', error);
  }

  return res.status(statusCode).json(responseBody);
};

export const sendResponseWithArtifactV3 = async ({
  req,
  res,
  entity,
  id,
  body,
  statusCode = 200,
}) => {
  return sendArtifactResponse({
    req,
    res,
    entity,
    id,
    body,
    statusCode,
    version: 'v3',
    responseBody: body,
  });
};