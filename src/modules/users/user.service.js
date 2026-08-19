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

export const updateUser = async (id, { name, email }) => {
  return await prisma.user.update({
    where: {
      id,
    },
    data: {
      name,
      email,
    },
  });
};

export const patchUser = async (id, data) => {
  return await prisma.user.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: {
      id,
    },
  });
};

export const queryUsers = async ({
  id,
  name,
  email,
  createdAt,
}) => {
  const where = {};

  if (id !== undefined) {
    where.id = id;
  }

  if (name !== undefined) {
    where.name = name;
  }

  if (email !== undefined) {
    where.email = email;
  }

  if (createdAt !== undefined) {
    where.createdAt = createdAt;
  }

  return await prisma.user.findMany({
    where,
  });
};

export const userHasLoans = async (userId) => {
  const loan = await prisma.loan.findFirst({
    where: {
      userId,
    },
  });

  return loan !== null;
};

export const getUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};