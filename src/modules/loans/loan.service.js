import { prisma } from '../../config/prisma.js';
import { getUserById } from '../users/user.service.js';
import { getBookById } from '../books/book.service.js';

export const createLoan = async ({
  userId,
  bookId,
  borrowedAt,
  dueDate,
  returnedAt,
}) => {
  return await prisma.loan.create({
    data: {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    },
  });
};

export const getLoans = async () => {
  return await prisma.loan.findMany();
};

export const getLoanById = async (id) => {
  return await prisma.loan.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
      book: true,
    },
  });
};

export const updateLoan = async (
  id,
  {
    userId,
    bookId,
    borrowedAt,
    dueDate,
    returnedAt,
  },
) => {
  return await prisma.loan.update({
    where: {
      id,
    },
    data: {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    },
  });
};

export const patchLoan = async (id, data) => {
  return await prisma.loan.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteLoan = async (id) => {
  return await prisma.loan.delete({
    where: {
      id,
    },
  });
};

export const queryLoans = async ({
  id,
  userId,
  bookId,
  borrowedAt,
  dueDate,
  returnedAt,
}) => {
  const where = {};

  if (id !== undefined) {
    where.id = id;
  }

  if (userId !== undefined) {
    where.userId = userId;
  }

  if (bookId !== undefined) {
    where.bookId = bookId;
  }

  if (borrowedAt !== undefined) {
    where.borrowedAt = borrowedAt;
  }

  if (dueDate !== undefined) {
    where.dueDate = dueDate;
  }

  if (returnedAt !== undefined) {
    where.returnedAt = returnedAt;
  }

  return await prisma.loan.findMany({
    where,
  });
};

export const userExists = async (userId) => {
  const user = await getUserById(userId);

  return user !== null;
};

export const bookExists = async (bookId) => {
  const book = await getBookById(bookId);

  return book !== null;
}

export const bookHasActiveLoan = async (bookId) => {
  const loan = await prisma.loan.findFirst({
    where: {
      bookId,
      returnedAt: null,
    },
  });

  return loan !== null;
};