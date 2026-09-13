import { Router } from 'express';

import { getUserByIdV2Controller } from './user.v2.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getUserByIdSchema } from './user.schema.js';

import commonRoutes from './user.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getUserByIdSchema),
  getUserByIdV2Controller
);

router.use(commonRoutes);

export default router;