import { prisma } from '../../config/prisma.js';

export const getLastBook = async () => {
  return await prisma.book.findFirst({
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
  });
};