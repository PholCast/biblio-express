import { Router } from 'express';
import { getLoanByIdV3Controller } from './loan.v3.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getLoanByIdSchema } from './loan.schema.js';
import commonRoutes from './loan.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getLoanByIdSchema),
  getLoanByIdV3Controller
);

router.use(commonRoutes);

export default router;
