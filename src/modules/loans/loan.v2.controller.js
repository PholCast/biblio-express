import { getLoanById } from './loan.service.js';
import { getLastLoan } from './loan.v2.service.js';
import { getPokemon } from '../../integrations/pokemon/pokemon.client.js';
import { getDoctor } from '../../integrations/doctors/doctors.client.js';

export const getLoanByIdV2Controller = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await getLoanById(id);

    if (!loan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    const [pokemon, doctor] = await Promise.all([
      getPokemon(),
      getDoctor(),
    ]);

    return res.status(200).json({
      loan,
      pokemon,
      doctor,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting loan, Pokemon and doctor',
    });
  }
};

export const getLastLoanV2Controller = async (req, res) => {
  try {
    const loan = await getLastLoan();

    if (!loan) {
      return res.status(404).json({
        message: 'No loans found',
      });
    }

    return res.status(200).json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting last loan',
    });
  }
};