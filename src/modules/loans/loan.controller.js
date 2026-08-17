import {
  createLoan,
  getLoans,
  userExists,
  bookExists,
  bookHasActiveLoan
} from './loan.service.js';

export const createLoanController = async (req, res) => {
  try {
    const {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    } = req.body;

    if (
      userId === undefined ||
      bookId === undefined ||
      dueDate === undefined
    ) {
      return res.status(400).json({
        message: 'userId, bookId and dueDate are required',
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: 'userId must be a positive integer',
      });
    }

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: 'bookId must be a positive integer',
      });
    }

    if (!(await userExists(userId))) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (!(await bookExists(bookId))) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    if (await bookHasActiveLoan(bookId)) {
    return res.status(409).json({
        message: 'Book is already on loan',
    });
    }

    const borrowedDate =
      borrowedAt !== undefined
        ? new Date(borrowedAt)
        : new Date();

    if (Number.isNaN(borrowedDate.getTime())) {
      return res.status(400).json({
        message: 'borrowedAt must be a valid date',
      });
    }

    const dueDateValue = new Date(dueDate);

    if (Number.isNaN(dueDateValue.getTime())) {
      return res.status(400).json({
        message: 'dueDate must be a valid date',
      });
    }

    let returnedDate = null;

    if (returnedAt !== undefined && returnedAt !== null) {
      returnedDate = new Date(returnedAt);

      if (Number.isNaN(returnedDate.getTime())) {
        return res.status(400).json({
          message: 'returnedAt must be a valid date or null',
        });
      }
    }

    const loan = await createLoan({
      userId,
      bookId,
      borrowedAt: borrowedDate,
      dueDate: dueDateValue,
      returnedAt: returnedDate,
    });

    return res.status(201).json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error creating loan',
    });
  }
};

export const getLoansController = async (req, res) => {
  try {
    const loans = await getLoans();

    return res.status(200).json(loans);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting loans',
    });
  }
};