import {
  describe,
  it,
  expect,
} from 'vitest';

import {
  createLoanSchema,
  updateLoanSchema,
  patchLoanSchema,
  getLoanByIdSchema,
  deleteLoanSchema,
  queryLoanSchema,
  validateLoanDatesSchema,
} from '../../src/modules/loans/loan.schema.js';

describe('createLoanSchema', () => {
  it('should validate a valid loan', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: null,
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.borrowedAt).toBeInstanceOf(Date);
    expect(result.data.body.dueDate).toBeInstanceOf(Date);
    expect(result.data.body.returnedAt).toBeNull();
  });

  it('should use the current date when borrowedAt is omitted', () => {
    const before = new Date();

    const data = {
      body: {
        userId: 1,
        bookId: 1,
        dueDate: '2099-08-24T10:00:00.000Z',
      },
    };

    const result = createLoanSchema.safeParse(data);

    const after = new Date();

    expect(result.success).toBe(true);
    expect(result.data.body.borrowedAt).toBeInstanceOf(Date);
    expect(result.data.body.borrowedAt.getTime())
      .toBeGreaterThanOrEqual(before.getTime());
    expect(result.data.body.borrowedAt.getTime())
      .toBeLessThanOrEqual(after.getTime());
  });

  it('should use null when returnedAt is omitted', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.returnedAt).toBeNull();
  });

  it('should transform date strings into Date objects', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: '2026-08-20T10:00:00.000Z',
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(true);

    expect(result.data.body.borrowedAt)
      .toEqual(new Date('2026-08-17T10:00:00.000Z'));

    expect(result.data.body.dueDate)
      .toEqual(new Date('2026-08-24T10:00:00.000Z'));

    expect(result.data.body.returnedAt)
      .toEqual(new Date('2026-08-20T10:00:00.000Z'));
  });

  it('should reject a non-positive userId', () => {
    const data = {
      body: {
        userId: 0,
        bookId: 1,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: null,
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject a non-positive bookId', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 0,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: null,
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid borrowedAt date', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: 'invalid-date',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: null,
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid dueDate date', () => {
    const data = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: 'invalid-date',
        returnedAt: null,
      },
    };

    const result = createLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when dueDate is before borrowedAt', () => {
    const result = createLoanSchema.safeParse({
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-20T10:00:00.000Z',
        dueDate: '2026-08-19T10:00:00.000Z',
        returnedAt: null,
      },
    });
  
    expect(result.success).toBe(false);
  
    expect(
      result.error.issues.some(
        (issue) =>
          issue.message === 'dueDate cannot be before borrowedAt'
      )
    ).toBe(true);
  });

  it('should reject when returnedAt is before borrowedAt', () => {
    const result = createLoanSchema.safeParse({
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: '2026-08-20T10:00:00.000Z',
        dueDate: '2026-08-21T10:00:00.000Z',
        returnedAt: '2026-08-19T10:00:00.000Z',
      },
    });
  
    expect(result.success).toBe(false);
  
    expect(
      result.error.issues.some(
        (issue) =>
          issue.message === 'returnedAt cannot be before borrowedAt'
      )
    ).toBe(true);
  });
});

describe('updateLoanSchema', () => {
  const validLoan = {
    userId: 1,
    bookId: 1,
    borrowedAt: '2026-08-17T10:00:00.000Z',
    dueDate: '2026-08-24T10:00:00.000Z',
    returnedAt: null,
  };

  it('should validate a valid loan update', () => {
    const data = {
      params: {
        id: 1,
      },
      body: validLoan,
    };

    const result = updateLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should coerce the id parameter to a number', () => {
    const data = {
      params: {
        id: '1',
      },
      body: validLoan,
    };

    const result = updateLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(1);
  });

  it('should reject an invalid id parameter', () => {
    const data = {
      params: {
        id: 'abc',
      },
      body: validLoan,
    };

    const result = updateLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when dueDate is before borrowedAt', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        ...validLoan,
        dueDate: '2026-08-10T10:00:00.000Z',
      },
    };

    const result = updateLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject when returnedAt is before borrowedAt', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        ...validLoan,
        returnedAt: '2026-08-10T10:00:00.000Z',
      },
    };

    const result = updateLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('patchLoanSchema', () => {
  it('should validate a patch with one field', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        bookId: 2,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a patch with multiple fields', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        userId: 2,
        bookId: 3,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should reject an empty patch body', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {},
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(false);

    expect(
      result.error.issues.some(
        (issue) =>
          issue.message === 'PATCH requires at least one field to update'
      )
    ).toBe(true);
  });

  it('should coerce the id parameter to a number', () => {
    const data = {
      params: {
        id: '5',
      },
      body: {
        bookId: 2,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(5);
  });

  it('should reject a non-positive id', () => {
    const data = {
      params: {
        id: 0,
      },
      body: {
        bookId: 2,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid userId', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        userId: 0,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid bookId', () => {
    const data = {
      params: {
        id: 1,
      },
      body: {
        bookId: 0,
      },
    };

    const result = patchLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('getLoanByIdSchema', () => {
  it('should validate a valid id', () => {
    const data = {
      params: {
        id: 1,
      },
    };

    const result = getLoanByIdSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should coerce a string id to a number', () => {
    const data = {
      params: {
        id: '10',
      },
    };

    const result = getLoanByIdSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(10);
  });

  it('should reject a non-positive id', () => {
    const data = {
      params: {
        id: 0,
      },
    };

    const result = getLoanByIdSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('deleteLoanSchema', () => {
  it('should validate a valid id', () => {
    const data = {
      params: {
        id: '1',
      },
    };

    const result = deleteLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.params.id).toBe(1);
  });

  it('should reject an invalid id', () => {
    const data = {
      params: {
        id: '-1',
      },
    };

    const result = deleteLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('queryLoanSchema', () => {
  it('should validate a query by id', () => {
    const data = {
      body: {
        id: 1,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by userId', () => {
    const data = {
      body: {
        userId: 1,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by bookId', () => {
    const data = {
      body: {
        bookId: 1,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should validate a query by date fields', () => {
    const data = {
      body: {
        borrowedAt: '2026-08-17T10:00:00.000Z',
        dueDate: '2026-08-24T10:00:00.000Z',
        returnedAt: '2026-08-20T10:00:00.000Z',
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(true);

    expect(result.data.body.borrowedAt).toBeInstanceOf(Date);
    expect(result.data.body.dueDate).toBeInstanceOf(Date);
    expect(result.data.body.returnedAt).toBeInstanceOf(Date);
  });

  it('should validate returnedAt as null', () => {
    const data = {
      body: {
        returnedAt: null,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(true);
    expect(result.data.body.returnedAt).toBeNull();
  });

  it('should reject an empty query', () => {
    const data = {
      body: {},
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(false);

    expect(
      result.error.issues.some(
        (issue) =>
          issue.message === 'QUERY requires at least one query criterion'
      )
    ).toBe(true);
  });

  it('should reject an invalid query id', () => {
    const data = {
      body: {
        id: 0,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid query userId', () => {
    const data = {
      body: {
        userId: -1,
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });

  it('should reject an invalid query date', () => {
    const data = {
      body: {
        borrowedAt: 'invalid-date',
      },
    };

    const result = queryLoanSchema.safeParse(data);

    expect(result.success).toBe(false);
  });
});

describe('validateLoanDatesSchema', () => {
  const validDates = {
    userId: 1,
    bookId: 1,
    borrowedAt: new Date('2026-08-17T10:00:00.000Z'),
    dueDate: new Date('2026-08-24T10:00:00.000Z'),
    returnedAt: null,
  };

  it('should validate valid loan dates', () => {
    const result = validateLoanDatesSchema.safeParse(validDates);

    expect(result.success).toBe(true);
  });

  it('should reject when dueDate is before borrowedAt', () => {
    const data = {
      ...validDates,
      dueDate: new Date('2026-08-10T10:00:00.000Z'),
    };

    const result = validateLoanDatesSchema.safeParse(data);

    expect(result.success).toBe(false);

    expect(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === 'dueDate' &&
          issue.message === 'dueDate cannot be before borrowedAt'
      )
    ).toBe(true);
  });

  it('should reject when returnedAt is before borrowedAt', () => {
    const data = {
      ...validDates,
      returnedAt: new Date('2026-08-10T10:00:00.000Z'),
    };

    const result = validateLoanDatesSchema.safeParse(data);

    expect(result.success).toBe(false);

    expect(
      result.error.issues.some(
        (issue) =>
          issue.path[0] === 'returnedAt' &&
          issue.message === 'returnedAt cannot be before borrowedAt'
      )
    ).toBe(true);
  });

  it('should allow returnedAt to be null', () => {
    const result = validateLoanDatesSchema.safeParse(validDates);

    expect(result.success).toBe(true);
  });

  it('should allow dueDate to be equal to borrowedAt', () => {
    const data = {
      ...validDates,
      dueDate: validDates.borrowedAt,
    };

    const result = validateLoanDatesSchema.safeParse(data);

    expect(result.success).toBe(true);
  });

  it('should allow returnedAt to be equal to borrowedAt', () => {
    const data = {
      ...validDates,
      returnedAt: validDates.borrowedAt,
    };

    const result = validateLoanDatesSchema.safeParse(data);

    expect(result.success).toBe(true);
  });
});