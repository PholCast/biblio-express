import { Router } from 'express';
import { getBookByIdV3Controller } from './book.v3.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getBookByIdSchema } from './book.schema.js';
import commonRoutes from './book.common.routes.js';

const router = Router();

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdV3Controller
);

router.use(commonRoutes);

export default router;
