import { Router } from 'express';

import { getBooksController } from './book.controller.js';
import commonRoutes from './book.common.routes.js';


const router = Router();

router.get('/', getBooksController);

router.use(commonRoutes);

export default router;