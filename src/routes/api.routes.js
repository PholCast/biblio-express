import { Router } from 'express';
import userRoutes from '../modules/users/user.routes.js';
import bookRoutes from '../modules/books/book.routes.js';
import loanRoutes from '../modules/loans/loan.routes.js';

const router = Router();

router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/loans', loanRoutes);

export default router;