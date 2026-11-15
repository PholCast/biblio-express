import { Router } from 'express';

import { chaosGuard } from './chaos.guard.js';
import {
  getChaosStatusController,
  startPoolExhaustionController,
  stopPoolExhaustionController,
} from './chaos.controller.js';

const router = Router();

router.use(chaosGuard);

router.get('/status', getChaosStatusController);

router.post('/pool-exhaustion', startPoolExhaustionController);

router.delete('/pool-exhaustion', stopPoolExhaustionController);

export default router;
