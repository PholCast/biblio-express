import { Router } from 'express';

import { getBookByIdV2Controller } from './book.v2.controller.js';

import { validate } from '../../middlewares/validate.js';
import { getBookByIdSchema } from './book.schema.js';

import commonRoutes from './book.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdV2Controller
);

router.use(commonRoutes);

export default router;