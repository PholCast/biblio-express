import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/modules/loans/loan.service.js', () => ({
  createLoan: vi.fn(),
  getLoans: vi.fn(),
  getLoanById: vi.fn(),
  updateLoan: vi.fn(),
  patchLoan: vi.fn(),
  deleteLoan: vi.fn(),
  queryLoans: vi.fn(),
  userExists: vi.fn(),
  bookExists: vi.fn(),
  bookHasActiveLoan: vi.fn(),
}));

vi.mock('../../src/modules/loans/loan.schema.js', () => ({
  validateLoanDatesSchema: {
    safeParse: vi.fn(),
  },
}));

import {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  patchLoan,
  deleteLoan,
  queryLoans,
  userExists,
  bookExists,
  bookHasActiveLoan,
} from '../../src/modules/loans/loan.service.js';

import {
  validateLoanDatesSchema,
} from '../../src/modules/loans/loan.schema.js';

import {
  createLoanController,
  getLoansController,
  getLoanByIdController,
  updateLoanController,
  patchLoanController,
  deleteLoanController,
  queryLoansController,
} from '../../src/modules/loans/loan.controller.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const createMockResponse = () => {
  const res = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);

  return res;
};

const loan = {
  id: 1,
  userId: 1,
  bookId: 1,
  borrowedAt: new Date('2026-08-17T00:00:00.000Z'),
  dueDate: new Date('2026-08-24T00:00:00.000Z'),
  returnedAt: null,
};

describe('createLoanController', () => {
  it('should create and return a loan', async () => {
    const req = {
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt: null,
      },
    };

    const res = createMockResponse();

    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    bookHasActiveLoan.mockResolvedValue(false);
    createLoan.mockResolvedValue(loan);

    await createLoanController(req, res);

    expect(userExists).toHaveBeenCalledWith(1);
    expect(bookExists).toHaveBeenCalledWith(1);
    expect(bookHasActiveLoan).toHaveBeenCalledWith(1);
    expect(createLoan).toHaveBeenCalledWith(req.body);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(loan);
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    userExists.mockResolvedValue(false);

    await createLoanController(req, res);

    expect(userExists).toHaveBeenCalledWith(1);
    expect(bookExists).not.toHaveBeenCalled();
    expect(bookHasActiveLoan).not.toHaveBeenCalled();
    expect(createLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(false);

    await createLoanController(req, res);

    expect(userExists).toHaveBeenCalledWith(1);
    expect(bookExists).toHaveBeenCalledWith(1);
    expect(bookHasActiveLoan).not.toHaveBeenCalled();
    expect(createLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 409 when the book already has an active loan', async () => {
    const req = {
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    bookHasActiveLoan.mockResolvedValue(true);

    await createLoanController(req, res);

    expect(bookHasActiveLoan).toHaveBeenCalledWith(1);
    expect(createLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book is already on loan',
    });
  });

  it('should return 500 when creating the loan fails', async () => {
    const req = {
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    bookHasActiveLoan.mockResolvedValue(false);
    createLoan.mockRejectedValue(new Error('Database error'));

    await createLoanController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creating loan',
    });
  });
});

describe('getLoansController', () => {
  it('should return all loans', async () => {
    const loans = [loan];

    const req = {};
    const res = createMockResponse();

    getLoans.mockResolvedValue(loans);

    await getLoansController(req, res);

    expect(getLoans).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loans);
  });

  it('should return 500 when getting loans fails', async () => {
    const req = {};
    const res = createMockResponse();

    getLoans.mockRejectedValue(new Error('Database error'));

    await getLoansController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting loans',
    });
  });
});

describe('getLoanByIdController', () => {
  it('should return the loan', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);

    await getLoanByIdController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loan);
  });

  it('should return 404 when the loan does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(null);

    await getLoanByIdController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Loan not found',
    });
  });

  it('should return 500 when getting the loan fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockRejectedValue(new Error('Database error'));

    await getLoanByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting loan',
    });
  });
});

describe('updateLoanController', () => {
  it('should update and return the loan', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt: null,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    updateLoan.mockResolvedValue(loan);

    await updateLoanController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);
    expect(userExists).toHaveBeenCalledWith(1);
    expect(bookExists).toHaveBeenCalledWith(1);
    expect(bookHasActiveLoan).not.toHaveBeenCalled();

    expect(updateLoan).toHaveBeenCalledWith(1, req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loan);
  });

  it('should return 404 when the loan does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(null);

    await updateLoanController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);
    expect(userExists).not.toHaveBeenCalled();
    expect(updateLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Loan not found',
    });
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 2,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(false);

    await updateLoanController(req, res);

    expect(userExists).toHaveBeenCalledWith(2);
    expect(bookExists).not.toHaveBeenCalled();
    expect(updateLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 404 when the book does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 2,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(false);

    await updateLoanController(req, res);

    expect(bookExists).toHaveBeenCalledWith(2);
    expect(bookHasActiveLoan).not.toHaveBeenCalled();
    expect(updateLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 409 when changing to a book with an active loan', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 2,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    bookHasActiveLoan.mockResolvedValue(true);

    await updateLoanController(req, res);

    expect(bookHasActiveLoan).toHaveBeenCalledWith(2);
    expect(updateLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book is already on loan',
    });
  });

  it('should not check for an active loan when keeping the same book', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 1,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt: null,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    updateLoan.mockResolvedValue(loan);

    await updateLoanController(req, res);

    expect(bookHasActiveLoan).not.toHaveBeenCalled();
    expect(updateLoan).toHaveBeenCalledWith(1, req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loan);
  });

  it('should return 500 when updating the loan fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 1,
        bookId: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(true);
    bookExists.mockResolvedValue(true);
    updateLoan.mockRejectedValue(new Error('Database error'));

    await updateLoanController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating loan',
    });
  });
});

describe('patchLoanController', () => {
  beforeEach(() => {
    validateLoanDatesSchema.safeParse.mockReturnValue({
      success: true,
    });
  });

  it('should patch and return the loan', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        returnedAt: new Date('2026-08-20T00:00:00.000Z'),
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    patchLoan.mockResolvedValue({
      ...loan,
      returnedAt: req.body.returnedAt,
    });

    await patchLoanController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);
    expect(validateLoanDatesSchema.safeParse).toHaveBeenCalled();
    expect(patchLoan).toHaveBeenCalledWith(1, req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ...loan,
      returnedAt: req.body.returnedAt,
    });
  });

  it('should return 404 when the loan does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        returnedAt: new Date('2026-08-20T00:00:00.000Z'),
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(null);

    await patchLoanController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);
    expect(userExists).not.toHaveBeenCalled();
    expect(bookExists).not.toHaveBeenCalled();
    expect(patchLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Loan not found',
    });
  });

  it('should return 404 when the patched user does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        userId: 2,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    userExists.mockResolvedValue(false);

    await patchLoanController(req, res);

    expect(userExists).toHaveBeenCalledWith(2);
    expect(bookExists).not.toHaveBeenCalled();
    expect(patchLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 404 when the patched book does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        bookId: 2,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    bookExists.mockResolvedValue(false);

    await patchLoanController(req, res);

    expect(bookExists).toHaveBeenCalledWith(2);
    expect(bookHasActiveLoan).not.toHaveBeenCalled();
    expect(patchLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book not found',
    });
  });

  it('should return 409 when changing to a book with an active loan', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        bookId: 2,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    bookExists.mockResolvedValue(true);
    bookHasActiveLoan.mockResolvedValue(true);

    await patchLoanController(req, res);

    expect(bookExists).toHaveBeenCalledWith(2);
    expect(bookHasActiveLoan).toHaveBeenCalledWith(2);
    expect(patchLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Book is already on loan',
    });
  });

  it('should return 400 when the resulting loan dates are invalid', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        dueDate: new Date('2026-08-10T00:00:00.000Z'),
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);

    validateLoanDatesSchema.safeParse.mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            message: 'dueDate must be after borrowedAt',
          },
        ],
      },
    });

    await patchLoanController(req, res);

    expect(validateLoanDatesSchema.safeParse).toHaveBeenCalled();

    expect(patchLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation error',
      errors: [
        {
          message: 'dueDate must be after borrowedAt',
        },
      ],
    });
  });

  it('should use existing values when fields are not included in the patch', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        returnedAt: null,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    patchLoan.mockResolvedValue({
      ...loan,
      returnedAt: null,
    });

    await patchLoanController(req, res);

    expect(validateLoanDatesSchema.safeParse).toHaveBeenCalledWith({
      userId: loan.userId,
      bookId: loan.bookId,
      borrowedAt: loan.borrowedAt,
      dueDate: loan.dueDate,
      returnedAt: null,
    });

    expect(patchLoan).toHaveBeenCalledWith(1, req.body);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 500 when patching the loan fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        returnedAt: new Date('2026-08-20T00:00:00.000Z'),
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    patchLoan.mockRejectedValue(new Error('Database error'));

    await patchLoanController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating loan',
    });
  });
});

describe('deleteLoanController', () => {
  it('should delete the loan and return 204', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    deleteLoan.mockResolvedValue(loan);

    await deleteLoanController(req, res);

    expect(getLoanById).toHaveBeenCalledWith(1);
    expect(deleteLoan).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('should return 404 when the loan does not exist', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(null);

    await deleteLoanController(req, res);

    expect(deleteLoan).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Loan not found',
    });
  });

  it('should return 500 when deleting the loan fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createMockResponse();

    getLoanById.mockResolvedValue(loan);
    deleteLoan.mockRejectedValue(new Error('Database error'));

    await deleteLoanController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error deleting loan',
    });
  });
});

describe('queryLoansController', () => {
  it('should return queried loans', async () => {
    const req = {
      body: {
        id: 1,
        userId: 1,
        bookId: 1,
        borrowedAt: loan.borrowedAt,
        dueDate: loan.dueDate,
        returnedAt: null,
      },
    };

    const res = createMockResponse();

    queryLoans.mockResolvedValue([loan]);

    await queryLoansController(req, res);

    expect(queryLoans).toHaveBeenCalledWith(req.body);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([loan]);
  });

  it('should return 500 when querying loans fails', async () => {
    const req = {
      body: {
        userId: 1,
      },
    };

    const res = createMockResponse();

    queryLoans.mockRejectedValue(new Error('Database error'));

    await queryLoansController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Error querying loans',
    });
  });
});