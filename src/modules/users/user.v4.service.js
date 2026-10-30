import { prisma } from '../../config/prisma.js';

export const getUserLoanSummary = async (userId) => {
  const activeLoans = await prisma.loan.count({
    where: {
      userId: Number(userId),
      returnedAt: null,
    },
  });

  return {
    hasActiveLoans: activeLoans > 0,
    activeLoans,
  };
};