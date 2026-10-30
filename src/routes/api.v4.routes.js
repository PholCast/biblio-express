import { Router } from 'express';
import userV4Routes from '../modules/users/user.v4.routes.js';
import bookV4Routes from '../modules/books/book.v4.routes.js';
import loanRoutes from '../modules/loans/loan.routes.js';

const router = Router();

router.use('/users', userV4Routes);
router.use('/books', bookV4Routes);
router.use('/loans', loanRoutes);

export default router;
