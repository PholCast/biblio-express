
import { Router } from 'express';

import { getBookByIdV4Controller } from './book.v4.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getBookByIdSchema } from './book.schema.js';
import commonRoutes from './book.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdV4Controller,
);

router.use(commonRoutes);

export default router;
