import { Router } from 'express';
import userV5Routes from '../modules/users/user.v5.routes.js';
import bookV5Routes from '../modules/books/book.v5.routes.js';
import loanV5Routes from '../modules/loans/loan.v5.routes.js';
import { v5ResponseMetadata } from '../observability/v5-response.js';

const router = Router();

router.use(v5ResponseMetadata);

router.use('/users', userV5Routes);
router.use('/books', bookV5Routes);
router.use('/loans', loanV5Routes);

export default router;
