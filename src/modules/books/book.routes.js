import { Router } from 'express';
import {
  createBookController,
  getBooksController,
  getBookByIdController
} from './book.controller.js';

const router = Router();

router.post('/', createBookController);
router.get('/', getBooksController);
router.get('/:id', getBookByIdController);

export default router;