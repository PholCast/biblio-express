import { Router } from 'express';
import { 
    createUserController, 
    getUsersController, 
    getUserByIdController, 
    updateUserController,
    patchUserController,
    deleteUserController 
} from './user.controller.js';

const router = Router();

router.post('/', createUserController);
router.get('/', getUsersController);
router.get('/:id', getUserByIdController);
router.put('/:id', updateUserController);
router.patch('/:id', patchUserController);
router.delete('/:id', deleteUserController);


export default router;