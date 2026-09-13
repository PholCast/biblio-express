import { prisma } from '../../config/prisma.js';

export const getLastUser = async () => {
  return await prisma.user.findFirst({
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