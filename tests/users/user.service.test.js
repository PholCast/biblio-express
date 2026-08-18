import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loan: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/config/prisma.js';

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  patchUser,
  deleteUser,
  queryUsers,
  userHasLoans,
} from '../../src/modules/users/user.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUser', () => {
  it('should create and return a user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const createdUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    };

    prisma.user.create.mockResolvedValue(createdUser);

    const result = await createUser(userData);

    expect(prisma.user.create).toHaveBeenCalledOnce();

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    });

    expect(result).toEqual(createdUser);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.create.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      createUser({
        name: 'John Doe',
        email: 'john@example.com',
      })
    ).rejects.toThrow('Database error');
  });
});

describe('getUsers', () => {
  it('should return all users', async () => {
    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date(),
      },
    ];

    prisma.user.findMany.mockResolvedValue(users);

    const result = await getUsers();

    expect(prisma.user.findMany).toHaveBeenCalledOnce();
    expect(prisma.user.findMany).toHaveBeenCalledWith();

    expect(result).toEqual(users);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.findMany.mockRejectedValue(
      new Error('Database error')
    );

    await expect(getUsers()).rejects.toThrow(
      'Database error'
    );
  });
});

describe('getUserById', () => {
  it('should return a user by id', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    };

    prisma.user.findUnique.mockResolvedValue(user);

    const result = await getUserById(1);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(user);
  });

  it('should return null when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await getUserById(999);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: 999,
      },
    });

    expect(result).toBeNull();
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.findUnique.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      getUserById(1)
    ).rejects.toThrow('Database error');
  });
});

describe('updateUser', () => {
  it('should update and return the user', async () => {
    const updatedUser = {
      id: 1,
      name: 'Updated User',
      email: 'updated@example.com',
      createdAt: new Date(),
    };

    prisma.user.update.mockResolvedValue(updatedUser);

    const result = await updateUser(1, {
      name: 'Updated User',
      email: 'updated@example.com',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data: {
        name: 'Updated User',
        email: 'updated@example.com',
      },
    });

    expect(result).toEqual(updatedUser);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.update.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      updateUser(1, {
        name: 'Updated User',
        email: 'updated@example.com',
      })
    ).rejects.toThrow('Database error');
  });
});

describe('patchUser', () => {
  it('should partially update and return the user', async () => {
    const updatedUser = {
      id: 1,
      name: 'Updated User',
      email: 'john@example.com',
      createdAt: new Date(),
    };

    const data = {
      name: 'Updated User',
    };

    prisma.user.update.mockResolvedValue(updatedUser);

    const result = await patchUser(1, data);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
      data,
    });

    expect(result).toEqual(updatedUser);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.update.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      patchUser(1, {
        name: 'Updated User',
      })
    ).rejects.toThrow('Database error');
  });
});

describe('deleteUser', () => {
  it('should delete the user', async () => {
    const deletedUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
    };

    prisma.user.delete.mockResolvedValue(deletedUser);

    const result = await deleteUser(1);

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(deletedUser);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.delete.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      deleteUser(1)
    ).rejects.toThrow('Database error');
  });
});

describe('queryUsers', () => {
  it('should query users by id', async () => {
    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      },
    ];

    prisma.user.findMany.mockResolvedValue(users);

    const result = await queryUsers({
      id: 1,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: 1,
      },
    });

    expect(result).toEqual(users);
  });

  it('should query users by name', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await queryUsers({
      name: 'John Doe',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        name: 'John Doe',
      },
    });
  });

  it('should query users by email', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await queryUsers({
      email: 'john@example.com',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        email: 'john@example.com',
      },
    });
  });

  it('should query users by createdAt', async () => {
    const createdAt = new Date(
      '2026-08-17T10:00:00.000Z'
    );

    prisma.user.findMany.mockResolvedValue([]);

    await queryUsers({
      createdAt,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        createdAt,
      },
    });
  });

  it('should query users using multiple criteria', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await queryUsers({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    });
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.user.findMany.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      queryUsers({
        name: 'John Doe',
      })
    ).rejects.toThrow('Database error');
  });
});

describe('userHasLoans', () => {
  it('should return true when the user has loans', async () => {
    prisma.loan.findFirst.mockResolvedValue({
      id: 1,
      userId: 1,
      bookId: 1,
    });

    const result = await userHasLoans(1);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
      },
    });

    expect(result).toBe(true);
  });

  it('should return false when the user has no loans', async () => {
    prisma.loan.findFirst.mockResolvedValue(null);

    const result = await userHasLoans(1);

    expect(prisma.loan.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 1,
      },
    });

    expect(result).toBe(false);
  });

  it('should propagate an error when Prisma fails', async () => {
    prisma.loan.findFirst.mockRejectedValue(
      new Error('Database error')
    );

    await expect(
      userHasLoans(1)
    ).rejects.toThrow('Database error');
  });
});