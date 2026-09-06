import express from 'express';
import apiRoutes from './routes/api.routes.js';
import apiV2Routes from './routes/api.v2.routes.js';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
    });
});

app.use('/api', apiRoutes);

app.use('/api/v2', apiV2Routes);

export default app;