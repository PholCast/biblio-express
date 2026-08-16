import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  patchUser,
  deleteUser,
  queryUsers 
} from './user.service.js';

export const createUserController = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await createUser({
      name,
      email,
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error creating user',
    });
  }
};

export const getUsersController = async (req, res) => {
  try {
    const users = await getUsers();

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting users',
    });
  }
}

export const getUserByIdController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting user',
    });
  }
};

export const updateUserController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email } = req.body;

    if (name === undefined || email === undefined) {
      return res.status(400).json({
        message: 'PUT requires name and email',
      });
    }

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const user = await updateUser(id, {
      name,
      email,
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating user',
    });
  }
};


export const patchUserController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
      return res.status(400).json({
        message: 'PATCH requires at least one field to update',
      });
    }

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const data = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (email !== undefined) {
      data.email = email;
    }

    const user = await patchUser(id, data);

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating user',
    });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    await deleteUser(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error deleting user',
    });
  }
};

export const queryUsersController = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (name === undefined && email === undefined) {
      return res.status(400).json({
        message: 'QUERY requires at least one query criterion',
      });
    }

    const users = await queryUsers({
      name,
      email,
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error querying users',
    });
  }
};