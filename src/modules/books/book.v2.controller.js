import { getBookById } from './book.service.js';
import { getPokemon } from '../../integrations/pokemon/pokemon.client.js';
import { getDoctor } from '../../integrations/doctors/doctors.client.js';

export const getBookByIdV2Controller = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    const [pokemon, doctor] = await Promise.all([
      getPokemon(),
      getDoctor(),
    ]);

    return res.status(200).json({
      book,
      pokemon,
      doctor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting book, Pokemon and doctor',
    });
  }
};