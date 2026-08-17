import { Router } from 'express';
import {
  createLoanController,
  getLoansController,
  getLoanByIdController
} from './loan.controller.js';

const router = Router();

router.post('/', createLoanController);
router.get('/', getLoansController);
router.get('/:id', getLoanByIdController);

export default router;