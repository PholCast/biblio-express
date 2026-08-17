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