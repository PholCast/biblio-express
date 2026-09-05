import { Router } from 'express';

import { getBooksV2Controller } from './book.v2.controller.js';
import commonRoutes from './book.common.routes.js';

const router = Router();

router.get('/', getBooksV2Controller);

router.use(commonRoutes);

export default router;