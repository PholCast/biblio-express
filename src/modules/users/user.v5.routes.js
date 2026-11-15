import { Router } from 'express';

import {
  getUserByIdV5Controller,
  getLastUserV5Controller,
} from './user.v5.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getUserByIdSchema } from './user.schema.js';
import commonRoutes from './user.common.routes.js';

const router = Router();

router.get('/last', getLastUserV5Controller);

router.get(
  '/:id',
  validate(getUserByIdSchema),
  getUserByIdV5Controller,
);

router.use(commonRoutes);

export default router;
