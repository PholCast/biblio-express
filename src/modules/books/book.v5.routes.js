import { Router } from 'express';

import { getBookByIdV5Controller } from './book.v5.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getBookByIdSchema } from './book.schema.js';
import commonRoutes from './book.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdV5Controller,
);

router.use(commonRoutes);

export default router;
