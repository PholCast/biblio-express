import { describe, it, expect, vi } from 'vitest';

const {
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  patchUserController,
  deleteUserController,
  queryUsersController,
  validationMiddleware,
} = vi.hoisted(() => ({
  createUserController: vi.fn(),
  getUsersController: vi.fn(),
  getUserByIdController: vi.fn(),
  updateUserController: vi.fn(),
  patchUserController: vi.fn(),
  deleteUserController: vi.fn(),
  queryUsersController: vi.fn(),
  validationMiddleware: vi.fn(),
}));

vi.mock('../../src/modules/users/user.controller.js', () => ({
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  patchUserController,
  deleteUserController,
  queryUsersController,
}));

vi.mock('../../src/modules/users/user.schema.js', () => ({
  createUserSchema: {},
  getUserByIdSchema: {},
  updateUserSchema: {},
  patchUserSchema: {},
  deleteUserSchema: {},
  queryUserSchema: {},
}));

vi.mock('../../src/middlewares/validate.js', () => ({
  validate: vi.fn(() => validationMiddleware),
}));

import router from '../../src/modules/users/user.routes.js';

const getRoute = (method, path) => {
  const layer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  );

  return layer?.route;
};

describe('user.routes', () => {
  it('should register POST / route', () => {
    const route = getRoute('post', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(createUserController);
  });

  it('should register GET / route', () => {
    const route = getRoute('get', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(1);
    expect(route.stack[0].handle).toBe(getUsersController);
  });

  it('should register GET /:id route', () => {
    const route = getRoute('get', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(getUserByIdController);
  });

  it('should register PUT /:id route', () => {
    const route = getRoute('put', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(updateUserController);
  });

  it('should register PATCH /:id route', () => {
    const route = getRoute('patch', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(patchUserController);
  });

  it('should register DELETE /:id route', () => {
    const route = getRoute('delete', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(deleteUserController);
  });

  it('should register QUERY / route', () => {
    const route = getRoute('query', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(queryUsersController);
  });
});