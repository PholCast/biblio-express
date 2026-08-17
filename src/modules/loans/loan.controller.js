import {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  patchLoan,
  deleteLoan,
  queryLoans,
  userExists,
  bookExists,
  bookHasActiveLoan
} from './loan.service.js';

import { validateLoanDatesSchema } from './loan.schema.js';

export const createLoanController = async (req, res) => {
  try {
    const {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    } = req.body;

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

    const loan = await createLoan({
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
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

export const getLoanByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await getLoanById(id);

    if (!loan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    return res.status(200).json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error getting loan',
    });
  }
};

export const updateLoanController = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    } = req.body;

    const existingLoan = await getLoanById(id);

    if (!existingLoan) {
      return res.status(404).json({
        message: 'Loan not found',
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

    if (
      bookId !== existingLoan.bookId &&
      await bookHasActiveLoan(bookId)
    ) {
      return res.status(409).json({
        message: 'Book is already on loan',
      });
    }

    const loan = await updateLoan(id, {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    });

    return res.status(200).json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating loan',
    });
  }
};

export const patchLoanController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLoan = await getLoanById(id);

    if (!existingLoan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    if (
      req.body.userId !== undefined &&
      !(await userExists(req.body.userId))
    ) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (
      req.body.bookId !== undefined &&
      !(await bookExists(req.body.bookId))
    ) {
      return res.status(404).json({
        message: 'Book not found',
      });
    }

    if (
      req.body.bookId !== undefined &&
      req.body.bookId !== existingLoan.bookId &&
      await bookHasActiveLoan(req.body.bookId)
    ) {
      return res.status(409).json({
        message: 'Book is already on loan',
      });
    }

    const updatedData = {
      userId: req.body.userId ?? existingLoan.userId,
      bookId: req.body.bookId ?? existingLoan.bookId,
      borrowedAt: req.body.borrowedAt ?? existingLoan.borrowedAt,
      dueDate: req.body.dueDate ?? existingLoan.dueDate,
      returnedAt: req.body.returnedAt !== undefined
        ? req.body.returnedAt
        : existingLoan.returnedAt,
    };

    const validation = validateLoanDatesSchema.safeParse(updatedData);

    if (!validation.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validation.error.issues,
      });
    }

    const loan = await patchLoan(id, req.body);

    return res.status(200).json(loan);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error updating loan',
    });
  }
};

export const deleteLoanController = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLoan = await getLoanById(id);

    if (!existingLoan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    await deleteLoan(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error deleting loan',
    });
  }
};


export const queryLoansController = async (req, res) => {
  try {
    const {
      id,
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    } = req.body;

    const loans = await queryLoans({
      id,
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    });

    return res.status(200).json(loans);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error querying loans',
    });
  }
};