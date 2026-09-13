import { getUserById } from './user.service.js';
import { getPokemon } from '../../integrations/pokemon/pokemon.client.js';
import { getDoctor } from '../../integrations/doctors/doctors.client.js';

export const getUserByIdV2Controller = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const [pokemon, doctor] = await Promise.all([
      getPokemon(),
      getDoctor(),
    ]);

    return res.status(200).json({
      user,
      pokemon,
      doctor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting user, Pokemon and doctor',
    });
  }
};