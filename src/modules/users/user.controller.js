import { 
  createUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  patchUser,
  deleteUser,
  queryUsers,
  userHasLoans 
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
    const { id } = req.params;

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
    const { id } = req.params;
    const { name, email } = req.body;

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
    const { id } = req.params;

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const user = await patchUser(id, req.body);

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
    const { id } = req.params;

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (await userHasLoans(id)) {
      return res.status(409).json({
        message: 'User cannot be deleted because they have associated loans',
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
    const {
      id,
      name,
      email,
      createdAt,
    } = req.body;

    const users = await queryUsers({
      id,
      name,
      email,
      createdAt,
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error querying users',
    });
  }
};