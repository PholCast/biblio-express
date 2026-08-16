import { Router } from 'express';
import {
  createBookController,
  getBooksController
} from './book.controller.js';

const router = Router();

router.post('/', createBookController);
router.get('/', getBooksController);

export default router;