import { Router } from 'express';

import { getLoansV2Controller } from './loan.v2.controller.js';
import commonRoutes from './loan.common.routes.js';

const router = Router();

router.get('/', getLoansV2Controller);

router.use(commonRoutes);

export default router;