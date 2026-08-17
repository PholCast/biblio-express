import { Router } from 'express';

import {
  createLoanController,
  getLoansController,
  getLoanByIdController,
  updateLoanController,
  patchLoanController,
  deleteLoanController,
  queryLoansController,
} from './loan.controller.js';

import {
  createLoanSchema,
  getLoanByIdSchema,
  updateLoanSchema,
  patchLoanSchema,
  deleteLoanSchema,
  queryLoanSchema,
} from './loan.schema.js';

import { validate } from '../../middlewares/validate.js';

const router = Router();

router.post(
  '/',
  validate(createLoanSchema),
  createLoanController
);

router.get(
  '/',
  getLoansController
);

router.get(
  '/:id',
  validate(getLoanByIdSchema),
  getLoanByIdController
);

router.put(
  '/:id',
  validate(updateLoanSchema),
  updateLoanController
);

router.patch(
  '/:id',
  validate(patchLoanSchema),
  patchLoanController
);

router.delete(
  '/:id',
  validate(deleteLoanSchema),
  deleteLoanController
);

router.query(
  '/',
  validate(queryLoanSchema),
  queryLoansController
);

export default router;