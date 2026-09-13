import { Router } from 'express';

import { getUserByIdController } from './user.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getUserByIdSchema } from './user.schema.js';

import commonRoutes from './user.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getUserByIdSchema),
  getUserByIdController
);

router.use(commonRoutes);

export default router;