import express from 'express';
import { uploadArtifact } from './artifact.controller.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/artifacts', uploadArtifact);

export default app;