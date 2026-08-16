import { prisma } from '../../config/prisma.js';

export const createUser = async ({ name, email }) => {
  return await prisma.user.create({
    data: {
      name,
      email,
    },
  });
};

export const getUsers = async () => {
  return await prisma.user.findMany();
};

export const getUserById = async (id) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
  });
};