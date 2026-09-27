import { getUserById } from './user.service.js';
import { getLastUser } from './user.v2.service.js';
import { getExternalEntities } from '../../integrations/external-entities.service.js';
import { sendResponseWithArtifact } from '../../infrastructure/storage/flow-artifact.service.js';

export const getUserByIdV2Controller = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const { pokemon, doctor } = await getExternalEntities(req.traceId);

    const responseBody = {
      user,
      pokemon,
      doctor,
    };

    return sendResponseWithArtifact({
      req,
      res,
      entity: 'users',
      id,
      body: responseBody,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting user, Pokemon and doctor',
    });
  }
};

export const getLastUserV2Controller = async (req, res) => {
  try {
    const user = await getLastUser();

    if (!user) {
      return res.status(404).json({
        message: 'No users found',
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting last user',
    });
  }
};