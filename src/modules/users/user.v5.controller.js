import { getUserById } from './user.service.js';
import { getUserLoanSummary } from './user.v5.service.js';

export const getUserByIdV5Controller = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const loanSummary = await getUserLoanSummary(id);

    return res.status(200).json({
      user,
      loans: loanSummary,
    });
  } catch (error) {
    console.error('Error getting user v5:', error);

    return res.status(500).json({
      message: 'Error getting user',
    });
  }
};
