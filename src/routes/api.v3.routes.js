import { Router } from 'express';
import userV3Routes from '../modules/users/user.v3.routes.js';
import bookV3Routes from '../modules/books/book.v3.routes.js';
import loanV3Routes from '../modules/loans/loan.v3.routes.js';

const router = Router();

router.use('/users', userV3Routes);
router.use('/books', bookV3Routes);
router.use('/loans', loanV3Routes);

export default router;
