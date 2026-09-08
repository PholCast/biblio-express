import { getUsers } from './user.service.js';
import { getDoctors } from '../../integrations/doctors/doctors.client.js';

export const getUsersV2Controller = async (req, res) => {
  try {
    const [users, doctors] = await Promise.all([
      getUsers(),
      getDoctors(),
    ]);

    return res.status(200).json({
      users,
      doctors,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting users and doctors',
    });
  }
};