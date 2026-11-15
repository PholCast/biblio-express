import { Router } from 'express';

import { getLoanByIdV5Controller } from './loan.v5.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getLoanByIdSchema } from './loan.schema.js';
import commonRoutes from './loan.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getLoanByIdSchema),
  getLoanByIdV5Controller,
);

router.use(commonRoutes);

export default router;
