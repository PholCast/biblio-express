import { Router } from 'express';
import userV2Routes from '../modules/users/user.v2.routes.js';
import bookV2Routes from '../modules/books/book.v2.routes.js';
import loanV2Routes from '../modules/loans/loan.v2.routes.js';

const router = Router();

router.use('/users', userV2Routes);
router.use('/books', bookV2Routes);
router.use('/loans', loanV2Routes);

export default router;