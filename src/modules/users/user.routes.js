import { Router } from 'express';
import { createUserController } from './user.controller.js';

const router = Router();

router.post('/', createUserController);

export default router;