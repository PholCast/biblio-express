import { Router } from 'express';

import { getLoanByIdController } from './loan.controller.js';
import commonRoutes from './loan.common.routes.js';
import { validate } from '../../middlewares/validate.js';

import { getLoanByIdSchema } from './loan.schema.js';

const router = Router();

router.get(
  '/:id',
  validate(getLoanByIdSchema),
  getLoanByIdController
);

router.use(commonRoutes);

export default router;