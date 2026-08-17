import { Router } from 'express';
import {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController
} from './book.controller.js';

const router = Router();

router.post('/', createBookController);
router.get('/', getBooksController);
router.get('/:id', getBookByIdController);
router.put('/:id', updateBookController);
router.patch('/:id', patchBookController);

export default router;