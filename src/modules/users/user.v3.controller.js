import { getUserById } from './user.service.js';
import { sendResponseWithArtifactV3 } from '../../infrastructure/storage/flow-artifact.service.js';

export const getUserByIdV3Controller = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    return sendResponseWithArtifactV3({
      req,
      res,
      entity: 'users',
      id,
      body: { user },
    });
  } catch (error) {
    console.error('Error getting user v3:', error);

    return res.status(500).json({
      message: 'Error getting user',
    });
  }
};
