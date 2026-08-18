import { describe, it, expect } from 'vitest';

import {
  createUserSchema,
  updateUserSchema,
  patchUserSchema,
  deleteUserSchema,
  getUserByIdSchema,
  queryUserSchema,
} from '../../src/modules/users/user.schema.js';

describe('createUserSchema', () => {
  it('should accept valid user data', () => {
    const result = createUserSchema.safeParse({
      body: {
        name: 'Phol',
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should reject an empty name', () => {
    const result = createUserSchema.safeParse({
      body: {
        name: '',
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid email', () => {
    const result = createUserSchema.safeParse({
      body: {
        name: 'Phol',
        email: 'invalid-email',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const result = createUserSchema.safeParse({
      body: {},
    });

    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('should accept valid user data and coerce id to number', () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        name: 'Phol',
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.params.id).toBe(1);
      expect(typeof result.data.params.id).toBe('number');
    }
  });

  it('should reject an invalid id', () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: 'abc',
      },
      body: {
        name: 'Phol',
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject a non-positive id', () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: '0',
      },
      body: {
        name: 'Phol',
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid user data', () => {
    const result = updateUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        name: '',
        email: 'invalid-email',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('patchUserSchema', () => {
  it('should accept a valid partial update', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        name: 'Updated name',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should accept a partial update with only email', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        email: 'updated@example.com',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should accept both optional fields', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        name: 'Updated name',
        email: 'updated@example.com',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should reject an empty body', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {},
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'PATCH requires at least one field to update'
      );
    }
  });

  it('should reject an invalid id', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: 'abc',
      },
      body: {
        name: 'Updated name',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid fields', () => {
    const result = patchUserSchema.safeParse({
      params: {
        id: '1',
      },
      body: {
        name: '',
        email: 'invalid-email',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('deleteUserSchema', () => {
  it('should accept a valid id', () => {
    const result = deleteUserSchema.safeParse({
      params: {
        id: '1',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.params.id).toBe(1);
    }
  });

  it('should reject an invalid id', () => {
    const result = deleteUserSchema.safeParse({
      params: {
        id: 'abc',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject a non-positive id', () => {
    const result = deleteUserSchema.safeParse({
      params: {
        id: '-1',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('getUserByIdSchema', () => {
  it('should accept a valid id', () => {
    const result = getUserByIdSchema.safeParse({
      params: {
        id: '1',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should reject an invalid id', () => {
    const result = getUserByIdSchema.safeParse({
      params: {
        id: 'abc',
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('queryUserSchema', () => {
  it('should accept a query by id', () => {
    const result = queryUserSchema.safeParse({
      body: {
        id: '1',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.body.id).toBe(1);
    }
  });

  it('should accept a query by name', () => {
    const result = queryUserSchema.safeParse({
      body: {
        name: 'Phol',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should accept a query by email', () => {
    const result = queryUserSchema.safeParse({
      body: {
        email: 'phol@example.com',
      },
    });

    expect(result.success).toBe(true);
  });

  it('should accept a query by createdAt', () => {
    const result = queryUserSchema.safeParse({
      body: {
        createdAt: '2026-08-17T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.body.createdAt).toBeInstanceOf(Date);
    }
  });

  it('should accept multiple query criteria', () => {
    const result = queryUserSchema.safeParse({
      body: {
        id: '1',
        name: 'Phol',
        email: 'phol@example.com',
        createdAt: '2026-08-17T12:00:00.000Z',
      },
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.body.id).toBe(1);
      expect(result.data.body.createdAt).toBeInstanceOf(Date);
    }
  });

  it('should reject an empty query', () => {
    const result = queryUserSchema.safeParse({
      body: {},
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'QUERY requires at least one query criterion'
      );
    }
  });

  it('should reject an invalid id', () => {
    const result = queryUserSchema.safeParse({
      body: {
        id: 'abc',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid email', () => {
    const result = queryUserSchema.safeParse({
      body: {
        email: 'invalid-email',
      },
    });

    expect(result.success).toBe(false);
  });

  it('should reject an invalid date', () => {
    const result = queryUserSchema.safeParse({
      body: {
        createdAt: 'not-a-date',
      },
    });

    expect(result.success).toBe(false);
  });
});