import { prisma } from '../../config/prisma.js';

export const getLastLoan = async () => {
  return await prisma.loan.findFirst({
    orderBy: [
      {
        updatedAt: 'desc',
      },
      {
        id: 'desc',
      },
    ]
  });
};