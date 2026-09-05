import { Router } from 'express';

import { getUsersV2Controller } from './user.v2.controller.js';
import commonRoutes from './user.common.routes.js';

const router = Router();

router.get('/', getUsersV2Controller);

router.use(commonRoutes);

export default router;