import { createUser } from './user.service.js';

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