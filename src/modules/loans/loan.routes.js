import { Router } from 'express';
import {
  createLoanController,
  getLoansController
} from './loan.controller.js';

const router = Router();

router.post('/', createLoanController);
router.get('/', getLoansController);

export default router;