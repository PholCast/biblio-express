import { describe, it, expect, vi } from 'vitest';

const {
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController,
  deleteBookController,
  queryBooksController,
  validationMiddleware,
} = vi.hoisted(() => ({
  createBookController: vi.fn(),
  getBooksController: vi.fn(),
  getBookByIdController: vi.fn(),
  updateBookController: vi.fn(),
  patchBookController: vi.fn(),
  deleteBookController: vi.fn(),
  queryBooksController: vi.fn(),
  validationMiddleware: vi.fn(),
}));

vi.mock('../../src/modules/books/book.controller.js', () => ({
  createBookController,
  getBooksController,
  getBookByIdController,
  updateBookController,
  patchBookController,
  deleteBookController,
  queryBooksController,
}));

vi.mock('../../src/modules/books/book.schema.js', () => ({
  createBookSchema: {},
  getBookByIdSchema: {},
  updateBookSchema: {},
  patchBookSchema: {},
  deleteBookSchema: {},
  queryBookSchema: {},
}));

vi.mock('../../src/middlewares/validate.js', () => ({
  validate: vi.fn(() => validationMiddleware),
}));

import router from '../../src/modules/books/book.routes.js';

const getRoute = (method, path) => {
  const layer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === path &&
      layer.route.methods[method]
  );

  return layer?.route;
};

describe('book.routes', () => {
  it('should register POST / route', () => {
    const route = getRoute('post', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(createBookController);
  });

  it('should register GET / route', () => {
    const route = getRoute('get', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(1);
    expect(route.stack[0].handle).toBe(getBooksController);
  });

  it('should register GET /:id route', () => {
    const route = getRoute('get', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(getBookByIdController);
  });

  it('should register PUT /:id route', () => {
    const route = getRoute('put', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(updateBookController);
  });

  it('should register PATCH /:id route', () => {
    const route = getRoute('patch', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(patchBookController);
  });

  it('should register DELETE /:id route', () => {
    const route = getRoute('delete', '/:id');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(deleteBookController);
  });

  it('should register QUERY / route', () => {
    const route = getRoute('query', '/');

    expect(route).toBeDefined();
    expect(route.stack).toHaveLength(2);
    expect(route.stack[0].handle).toBe(validationMiddleware);
    expect(route.stack[1].handle).toBe(queryBooksController);
  });
});