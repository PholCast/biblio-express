import { prisma } from '../../config/prisma.js';

export const getBookAvailability = async (bookId) => {
  const activeLoans = await prisma.loan.count({
    where: {
      bookId: Number(bookId),
      returnedAt: null,
    },
  });

  return {
    isAvailable: activeLoans === 0
  };
};
