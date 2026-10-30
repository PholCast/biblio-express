import express from 'express';
import './observability/business-metrics.js';
import apiRoutes from './routes/api.routes.js';
import apiV2Routes from './routes/api.v2.routes.js';
import apiV3Routes from './routes/api.v3.routes.js';
import { requestLogger } from './observability/request-logger.js';
import { traceContext } from './observability/trace-context.js';
import { apiMetadata } from './middlewares/api-metadata.js';
import { httpMetrics } from './observability/http-metrics.js';

const app = express();

app.use(express.json());
app.use(traceContext);
app.use(apiMetadata);
app.use(requestLogger);
app.use(httpMetrics);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

app.use('/api', apiRoutes);

app.use('/api/v2', apiV2Routes);

app.use('/api/v3', apiV3Routes);

export default app;