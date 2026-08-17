import { Router } from 'express';
import {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController
} from './book.controller.js';

const router = Router();

router.post('/', createBookController);
router.get('/', getBooksController);
router.get('/:id', getBookByIdController);
router.put('/:id', updateBookController);

export default router;