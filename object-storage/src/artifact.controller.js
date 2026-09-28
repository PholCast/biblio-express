import { uploadFlowArtifact } from './blob-storage.service.js';

export const uploadArtifact = async (req, res) => {
  try {
    const {
      entity,
      id,
      traceId,
      otelTraceId,
      spanId,
      traceparent,
      request,
      response,
    } = req.body;

    if (!entity || id === undefined || !traceId || !request || !response) {
      return res.status(400).json({
        message: 'Invalid artifact payload',
      });
    }

    const blobName = await uploadFlowArtifact({
      entity,
      id,
      traceId,
      otelTraceId,
      spanId,
      traceparent,
      request,
      response,
    });

    return res.status(201).json({ blobName });
  } catch (error) {
    console.error('Blob Storage error:', error);

    return res.status(500).json({
      message: 'Error uploading artifact',
    });
  }
};