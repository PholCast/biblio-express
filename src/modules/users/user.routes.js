import { Router } from 'express';

import { getUsersController } from './user.controller.js';
import commonRoutes from './user.common.routes.js';

const router = Router();

router.get('/', getUsersController);

router.use(commonRoutes);

export default router;