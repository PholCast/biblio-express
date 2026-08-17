import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';

vi.mock('../../src/modules/users/user.service.js', () => ({
  createUser: vi.fn(),
  getUsers: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  patchUser: vi.fn(),
  deleteUser: vi.fn(),
  queryUsers: vi.fn(),
  userHasLoans: vi.fn(),
}));

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

import {
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  patchUserController,
  deleteUserController,
  queryUsersController,
} from '../../src/modules/users/user.controller.js';

const createResponseMock = () => {
  const res = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);

  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUserController', () => {
  it('should create a user and return 201', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    const res = createResponseMock();

    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    createUser.mockResolvedValue(user);

    await createUserController(req, res);

    expect(createUser).toHaveBeenCalledOnce();

    expect(createUser).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should return 500 when creating the user fails', async () => {
    const req = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    const res = createResponseMock();

    createUser.mockRejectedValue(
      new Error('Database error')
    );

    await createUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error creating user',
    });
  });
});

describe('getUsersController', () => {
  it('should return all users with 200', async () => {
    const req = {};
    const res = createResponseMock();

    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
    ];

    getUsers.mockResolvedValue(users);

    await getUsersController(req, res);

    expect(getUsers).toHaveBeenCalledOnce();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('should return 500 when getting users fails', async () => {
    const req = {};
    const res = createResponseMock();

    getUsers.mockRejectedValue(
      new Error('Database error')
    );

    await getUsersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting users',
    });
  });
});

describe('getUserByIdController', () => {
  it('should return the user with 200', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    getUserById.mockResolvedValue(user);

    await getUserByIdController(req, res);

    expect(getUserById).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue(null);

    await getUserByIdController(req, res);

    expect(getUserById).toHaveBeenCalledWith(999);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 500 when getting the user fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getUserById.mockRejectedValue(
      new Error('Database error')
    );

    await getUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error getting user',
    });
  });
});

describe('updateUserController', () => {
  it('should update the user and return 200', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        name: 'Updated User',
        email: 'updated@example.com',
      },
    };

    const res = createResponseMock();

    const existingUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    const updatedUser = {
      id: 1,
      name: 'Updated User',
      email: 'updated@example.com',
    };

    getUserById.mockResolvedValue(existingUser);
    updateUser.mockResolvedValue(updatedUser);

    await updateUserController(req, res);

    expect(getUserById).toHaveBeenCalledWith(1);

    expect(updateUser).toHaveBeenCalledWith(1, {
      name: 'Updated User',
      email: 'updated@example.com',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
      body: {
        name: 'Updated User',
        email: 'updated@example.com',
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue(null);

    await updateUserController(req, res);

    expect(getUserById).toHaveBeenCalledWith(999);
    expect(updateUser).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 500 when updating the user fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        name: 'Updated User',
        email: 'updated@example.com',
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    updateUser.mockRejectedValue(
      new Error('Database error')
    );

    await updateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating user',
    });
  });
});

describe('patchUserController', () => {
  it('should patch the user and return 200', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        name: 'Updated Name',
      },
    };

    const res = createResponseMock();

    const updatedUser = {
      id: 1,
      name: 'Updated Name',
      email: 'john@example.com',
    };

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    patchUser.mockResolvedValue(updatedUser);

    await patchUserController(req, res);

    expect(getUserById).toHaveBeenCalledWith(1);

    expect(patchUser).toHaveBeenCalledWith(1, {
      name: 'Updated Name',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
      body: {
        name: 'Updated Name',
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue(null);

    await patchUserController(req, res);

    expect(patchUser).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 500 when patching the user fails', async () => {
    const req = {
      params: {
        id: 1,
      },
      body: {
        name: 'Updated Name',
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    patchUser.mockRejectedValue(
      new Error('Database error')
    );

    await patchUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error updating user',
    });
  });
});

describe('deleteUserController', () => {
  it('should delete the user and return 204', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    userHasLoans.mockResolvedValue(false);
    deleteUser.mockResolvedValue();

    await deleteUserController(req, res);

    expect(getUserById).toHaveBeenCalledWith(1);
    expect(userHasLoans).toHaveBeenCalledWith(1);
    expect(deleteUser).toHaveBeenCalledWith(1);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledOnce();
  });

  it('should return 404 when the user does not exist', async () => {
    const req = {
      params: {
        id: 999,
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue(null);

    await deleteUserController(req, res);

    expect(userHasLoans).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found',
    });
  });

  it('should return 409 when the user has associated loans', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    userHasLoans.mockResolvedValue(true);

    await deleteUserController(req, res);

    expect(userHasLoans).toHaveBeenCalledWith(1);
    expect(deleteUser).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(409);

    expect(res.json).toHaveBeenCalledWith({
      message:
        'User cannot be deleted because they have associated loans',
    });
  });

  it('should return 500 when deleting the user fails', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const res = createResponseMock();

    getUserById.mockResolvedValue({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });

    userHasLoans.mockResolvedValue(false);

    deleteUser.mockRejectedValue(
      new Error('Database error')
    );

    await deleteUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error deleting user',
    });
  });
});

describe('queryUsersController', () => {
  it('should query users and return 200', async () => {
    const req = {
      body: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(
          '2026-08-17T10:00:00.000Z'
        ),
      },
    };

    const res = createResponseMock();

    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: req.body.createdAt,
      },
    ];

    queryUsers.mockResolvedValue(users);

    await queryUsersController(req, res);

    expect(queryUsers).toHaveBeenCalledWith({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: req.body.createdAt,
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(users);
  });

  it('should return 500 when querying users fails', async () => {
    const req = {
      body: {
        name: 'John Doe',
      },
    };

    const res = createResponseMock();

    queryUsers.mockRejectedValue(
      new Error('Database error')
    );

    await queryUsersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Error querying users',
    });
  });
});