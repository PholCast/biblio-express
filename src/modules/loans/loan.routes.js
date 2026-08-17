import { Router } from 'express';
import {
  createLoanController,
  getLoansController,
  getLoanByIdController,
  updateLoanController
} from './loan.controller.js';

const router = Router();

router.post('/', createLoanController);
router.get('/', getLoansController);
router.get('/:id', getLoanByIdController);
router.put('/:id', updateLoanController);


export default router;