import { Router } from 'express';
import {
  createLoanController
} from './loan.controller.js';

const router = Router();

router.post('/', createLoanController);

export default router;