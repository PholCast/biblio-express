import { createUser, getUsers, getUserById } from './user.service.js';

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