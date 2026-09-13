import { Router } from 'express';

import { getLoanByIdV2Controller } from './loan.v2.controller.js';
import commonRoutes from './loan.common.routes.js';
import { validate } from '../../middlewares/validate.js';

import { getLoanByIdSchema } from './loan.schema.js';


const router = Router();

router.get(
  '/:id',
  validate(getLoanByIdSchema),
  getLoanByIdV2Controller
);

router.use(commonRoutes);

export default router;