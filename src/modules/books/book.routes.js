import { Router } from 'express';
import {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController,
  deleteBookController
} from './book.controller.js';

const router = Router();

router.post('/', createBookController);
router.get('/', getBooksController);
router.get('/:id', getBookByIdController);
router.put('/:id', updateBookController);
router.patch('/:id', patchBookController);
router.delete('/:id', deleteBookController);

export default router;