import {
  describe,
  it,
  expect,
} from 'vitest';

import {
  createBookSchema,
  updateBookSchema,
  patchBookSchema,
  getBookByIdSchema,
  deleteBookSchema,
  queryBookSchema,
} from '../../src/modules/books/book.schema.js';

describe('createBookSchema', () => {
  it('should validate a valid book', () => {
    const data = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.publishedAt).toEqual(
      new Date('2008-08-01T00:00:00.000Z')
    );
  });

  it('should reject when title is missing', () => {
    const data = {
      body: {
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when author is missing', () => {
    const data = {
      body: {
        title: 'Clean Code',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when isbn is missing', () => {
    const data = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        publishedAt: '2008-08-01',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when publishedAt is missing', () => {
    const data = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when a required string is empty', () => {
    const data = {
      body: {
        title: '',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid publishedAt date', () => {
    const data = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-99-99',
      },
    };

    const result = createBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('updateBookSchema', () => {
  it('should validate a valid book update', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = updateBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(1);
    expect(result.data.body.publishedAt).toEqual(
      new Date('2008-08-01T00:00:00.000Z')
    );
  });

  it('should coerce a numeric string id to a number', () => {
    const data = {
      params: {
        id: '25',
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = updateBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(25);
    expect(typeof result.data.params.id).toBe('number');
  });

  it('should reject a non-positive id', () => {
    const data = {
      params: {
        id: '0',
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = updateBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject a non-integer id', () => {
    const data = {
      params: {
        id: '1.5',
      },
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = updateBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('patchBookSchema', () => {
  it('should validate a patch with one field', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {
        title: 'Clean Code Updated',
      },
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(1);
  });

  it('should validate a patch with multiple fields', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {
        title: 'Clean Code Updated',
        author: 'Robert C. Martin',
      },
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should transform publishedAt to a Date', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {
        publishedAt: '2008-08-01',
      },
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.publishedAt).toEqual(
      new Date('2008-08-01T00:00:00.000Z')
    );
  });

  it('should reject an empty patch body', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {},
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(
      'PATCH requires at least one field to update'
    );
  });

  it('should reject an invalid id', () => {
    const data = {
      params: {
        id: '0',
      },
      body: {
        title: 'Clean Code',
      },
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an empty field value', () => {
    const data = {
      params: {
        id: '1',
      },
      body: {
        title: '',
      },
    };

    const result = patchBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('getBookByIdSchema', () => {
  it('should validate a valid id', () => {
    const data = {
      params: {
        id: '1',
      },
    };

    const result = getBookByIdSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(1);
  });

  it('should reject an invalid id', () => {
    const data = {
      params: {
        id: '0',
      },
    };

    const result = getBookByIdSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject a non-numeric id', () => {
    const data = {
      params: {
        id: 'abc',
      },
    };

    const result = getBookByIdSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('deleteBookSchema', () => {
  it('should validate a valid id', () => {
    const data = {
      params: {
        id: '5',
      },
    };

    const result = deleteBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(5);
  });

  it('should reject a non-positive id', () => {
    const data = {
      params: {
        id: '-1',
      },
    };

    const result = deleteBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('queryBookSchema', () => {
  it('should validate a query by id', () => {
    const data = {
      body: {
        id: '1',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.id).toBe(1);
  });

  it('should validate a query by title', () => {
    const data = {
      body: {
        title: 'Clean Code',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by author', () => {
    const data = {
      body: {
        author: 'Robert C. Martin',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by isbn', () => {
    const data = {
      body: {
        isbn: '9780132350884',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by publishedAt', () => {
    const data = {
      body: {
        publishedAt: '2008-08-01',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.publishedAt).toEqual(
      new Date('2008-08-01T00:00:00.000Z')
    );
  });

  it('should validate a query with multiple criteria', () => {
    const data = {
      body: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '9780132350884',
        publishedAt: '2008-08-01',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.publishedAt).toEqual(
      new Date('2008-08-01T00:00:00.000Z')
    );
  });

  it('should reject an empty query body', () => {
    const data = {
      body: {},
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe(
      'QUERY requires at least one query criterion'
    );
  });

  it('should reject a non-positive id', () => {
    const data = {
      body: {
        id: '0',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an empty title', () => {
    const data = {
      body: {
        title: '',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an empty author', () => {
    const data = {
      body: {
        author: '',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an empty isbn', () => {
    const data = {
      body: {
        isbn: '',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid publishedAt date', () => {
    const data = {
      body: {
        publishedAt: '2026-99-99',
      },
    };

    const result = queryBookSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});