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


export const userExists = async (userId) => {
  const user = await getUserById(userId);

  return user !== null;
};

export const bookExists = async (bookId) => {
  const book = await getBookById(bookId);

  return book !== null;
}