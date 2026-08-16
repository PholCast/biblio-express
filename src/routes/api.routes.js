import { Router } from 'express';
import userRoutes from '../modules/users/user.routes.js';
import bookRoutes from '../modules/books/book.routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/books', bookRoutes);

export default router;