import { Router } from 'express';
import { getUserByIdV3Controller } from './user.v3.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getUserByIdSchema } from './user.schema.js';
import commonRoutes from './user.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getUserByIdSchema),
  getUserByIdV3Controller
);

router.use(commonRoutes);

export default router;
