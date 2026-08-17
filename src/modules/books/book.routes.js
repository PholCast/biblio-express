import { Router } from 'express';

import {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController,
  deleteBookController,
  queryBooksController,
} from './book.controller.js';

import {
  createBookSchema,
  getBookByIdSchema,
  updateBookSchema,
  patchBookSchema,
  deleteBookSchema,
  queryBookSchema,
} from './book.schema.js';

import { validate } from '../../middlewares/validate.js';

const router = Router();

router.post(
  '/',
  validate(createBookSchema),
  createBookController
);

router.get(
  '/',
  getBooksController
);

router.get(
  '/:id',
  validate(getBookByIdSchema),
  getBookByIdController
);

router.put(
  '/:id',
  validate(updateBookSchema),
  updateBookController
);

router.patch(
  '/:id',
  validate(patchBookSchema),
  patchBookController
);

router.delete(
  '/:id',
  validate(deleteBookSchema),
  deleteBookController
);

router.query(
  '/',
  validate(queryBookSchema),
  queryBooksController
);

export default router;