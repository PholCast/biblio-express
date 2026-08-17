import { Router } from 'express';
import {
  createLoanController,
  getLoansController,
  getLoanByIdController,
  updateLoanController,
  patchLoanController,
  deleteLoanController,
  queryLoansController
} from './loan.controller.js';

const router = Router();

router.post('/', createLoanController);
router.get('/', getLoansController);
router.get('/:id', getLoanByIdController);
router.put('/:id', updateLoanController);
router.patch('/:id', patchLoanController);
router.delete('/:id', deleteLoanController);
router.query('/', queryLoansController);

export default router;