import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    loan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../src/modules/users/user.service.js', () => ({
  getUserById: vi.fn(),
}));

vi.mock('../../src/modules/books/book.service.js', () => ({
  getBookById: vi.fn(),
}));

import { prisma } from '../../src/config/prisma.js';
import { getUserById } from '../../src/modules/users/user.service.js';
import { getBookById } from '../../src/modules/books/book.service.js';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createLoan', () => {
  it('should create and return a loan', async () => {
    const loanData = {
      userId: 1,
      bookId: 2,
      borrowedAt: new Date('2026-08-17T10:00:00.000Z'),
      dueDate: new Date('2026-08-24T10:00:00.000Z'),
      returnedAt: null,
    };

    const createdLoan = {
      id: 1,
      ...loanData,
    };

    prisma.loan.create.mockResolvedValue(createdLoan);

    const result = await createLoan(loanData);

    expect(prisma.loan.create).toHaveBeenCalledWith({
      data: loanData,
    });

    expect(result).toEqual(createdLoan);
  });
});

describe('getLoans', () => {
  it('should return all loans', async () => {
    const loans = [
      {
        id: 1,
        userId: 1,
        bookId: 2,
      },
      {
        id: 2,
        userId: 2,
        bookId: 3,
      },
    ];

    prisma.loan.findMany.mockResolvedValue(loans);

    const result = await getLoans();

    expect(prisma.loan.findMany).toHaveBeenCalledWith();
    expect(result).toEqual(loans);
  });
});

describe('getLoanById', () => {
  it('should return a loan by id with user and book', async () => {
    const loan = {
      id: 1,
      userId: 1,
      bookId: 2,
      user: {
        id: 1,
        name: 'John Doe',
      },
      book: {
        id: 2,
        title: 'Clean Code',
      },
    };

    prisma.loan.findUnique.mockResolvedValue(loan);

    const result = await getLoanById(1);

    expect(prisma.loan.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      include: {
        user: true,
        book: true,
      },
    });

    expect(result).toEqual(loan);
  });

  it('should return null when the loan does not exist', async () => {
    prisma.loan.findUnique.mockResolvedValue(null);

    const result = await getLoanById(999);

    expect(prisma.loan.findUnique).toHaveBeenCalledWith({
      where: {
        id: 999,
      },
      include: {
        user: true,
        book: true,
      },
    });

    expect(result).toBeNull();
  });
});

describe('updateLoan', () => {
  it('should update and return a loan', async () => {
    const loanData = {
      userId: 2,
      bookId: 3,
      borrowedAt: new Date('2026-08-17T10:00:00.000Z'),
      dueDate: new Date('2026-08-25T10:00:00.000Z'),
      returnedAt: null,
    };

    const updatedLoan = {
      id: 1,
      ...loanData,
    };

    prisma.loan.update.mockResolvedValue(updatedLoan);

    const result = await updateLoan(1, loanData);

    expect(prisma.loan.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: loanData,
    });

    expect(result).toEqual(updatedLoan);
  });
});

describe('patchLoan', () => {
  it('should patch and return a loan', async () => {
    const data = {
      returnedAt: new Date('2026-08-20T10:00:00.000Z'),
    };

    const patchedLoan = {
      id: 1,
      userId: 1,
      bookId: 2,
      ...data,
    };

    prisma.loan.update.mockResolvedValue(patchedLoan);

    const result = await patchLoan(1, data);

    expect(prisma.loan.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data,
    });

    expect(result).toEqual(patchedLoan);
  });
});

describe('deleteLoan', () => {
  it('should delete and return a loan', async () => {
    const deletedLoan = {
      id: 1,
      userId: 1,
      bookId: 2,
    };

    prisma.loan.delete.mockResolvedValue(deletedLoan);

    const result = await deleteLoan(1);

    expect(prisma.loan.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(deletedLoan);
  });
});

describe('queryLoans', () => {
  it('should query loans using all criteria', async () => {
    const criteria = {
      id: 1,
      userId: 2,
      bookId: 3,
      borrowedAt: new Date('2026-08-17T10:00:00.000Z'),
      dueDate: new Date('2026-08-24T10:00:00.000Z'),
      returnedAt: null,
    };

    const loans = [
      {
        id: 1,
        ...criteria,
      },
    ];

    prisma.loan.findMany.mockResolvedValue(loans);

    const result = await queryLoans(criteria);

    expect(prisma.loan.findMany).toHaveBeenCalledWith({
      where: criteria,
    });

    expect(result).toEqual(loans);
  });

  it('should query loans using only the provided criteria', async () => {
    const criteria = {
      userId: 1,
      bookId: 2,
    };

    const loans = [
      {
        id: 1,
        userId: 1,
        bookId: 2,
      },
    ];

    prisma.loan.findMany.mockResolvedValue(loans);

    const result = await queryLoans(criteria);

    expect(prisma.loan.findMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        bookId: 2,
      },
    });

    expect(result).toEqual(loans);
  });

  it('should query all loans when no criteria are provided', async () => {
    const loans = [
      {
        id: 1,
        userId: 1,
        bookId: 2,
      },
    ];

    prisma.loan.findMany.mockResolvedValue(loans);

    const result = await queryLoans({});

    expect(prisma.loan.findMany).toHaveBeenCalledWith({
      where: {},
    });

    expect(result).toEqual(loans);
  });
});

describe('userExists', () => {
  it('should return true when the user exists', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    getUserById.mockResolvedValue(user);

    const result = await userExists(1);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  it('should return false when the user does not exist', async () => {
    getUserById.mockResolvedValue(null);

    const result = await userExists(999);

    expect(getUserById).toHaveBeenCalledWith(999);
    expect(result).toBe(false);
  });
});

describe('bookExists', () => {
  it('should return true when the book exists', async () => {
    const book = {
      id: 1,
      title: 'Clean Code',
      author: 'Robert C. Martin',
    };

    getBookById.mockResolvedValue(book);

    const result = await bookExists(1);

    expect(getBookById).toHaveBeenCalledWith(1);
    expect(result).toBe(true);
  });

  it('should return false when the book does not exist', async () => {
    getBookById.mockResolvedValue(null);

    const result = await bookExists(999);

    expect(getBookById).toHaveBeenCalledWith(999);
    expect(result).toBe(false);
  });
});

describe('bookHasActiveLoan', () => {
  it('should return true when the book has an active loan', async () => {
    const loan = {
      id: 1,
      bookId: 2,
      returnedAt: null,
    };

    prisma.loan.findFirst.mockResolvedValue(loan);

    const result = await bookHasActiveLoan(2);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        bookId: 2,
        returnedAt: null,
      },
    });

    expect(result).toBe(true);
  });

  it('should return false when the book has no active loan', async () => {
    prisma.loan.findFirst.mockResolvedValue(null);

    const result = await bookHasActiveLoan(2);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        bookId: 2,
        returnedAt: null,
      },
    });

    expect(result).toBe(false);
  });
});