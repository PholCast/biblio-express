import { Router } from 'express';

import { getLoansController } from './loan.controller.js';
import commonRoutes from './loan.common.routes.js';


const router = Router();

router.get('/', getLoansController);

router.use(commonRoutes);

export default router;