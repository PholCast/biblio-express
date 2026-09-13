import { Router } from 'express';

import { getBookByIdController } from './book.controller.js';
import { validate } from '../../middlewares/validate.js';
import { getBookByIdSchema } from './book.schema.js';
import commonRoutes from './book.common.routes.js';


const router = Router();

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdController
);

router.use(commonRoutes);

export default router;