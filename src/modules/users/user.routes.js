import { Router } from 'express';

import {
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  patchUserController,
  deleteUserController,
  queryUsersController,
} from './user.controller.js';

import {
  createUserSchema,
  getUserByIdSchema,
  updateUserSchema,
  patchUserSchema,
  deleteUserSchema,
  queryUserSchema,
} from './user.schema.js';

import { validate } from '../../middlewares/validate.js';

const router = Router();

router.post(
  '/',
  validate(createUserSchema),
  createUserController
);

router.get(
  '/',
  getUsersController
);

router.get(
  '/:id',
  validate(getUserByIdSchema),
  getUserByIdController
);

router.put(
  '/:id',
  validate(updateUserSchema),
  updateUserController
);

router.patch(
  '/:id',
  validate(patchUserSchema),
  patchUserController
);

router.delete(
  '/:id',
  validate(deleteUserSchema),
  deleteUserController
);

router.query(
  '/',
  validate(queryUserSchema),
  queryUsersController
);

export default router;