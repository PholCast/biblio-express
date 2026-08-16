import { prisma } from '../../config/prisma.js';

export const createUser = async ({ name, email }) => {
  return await prisma.user.create({
    data: {
      name,
      email,
    },
  });
};