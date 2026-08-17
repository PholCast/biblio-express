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

export const getLoanByIdController = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

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
      borrowedAt === undefined ||
      dueDate === undefined ||
      returnedAt === undefined
    ) {
      return res.status(400).json({
        message:
          'PUT requires userId, bookId, borrowedAt, dueDate and returnedAt',
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

    const borrowedDate = new Date(borrowedAt);

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

    if (returnedAt !== null) {
      returnedDate = new Date(returnedAt);

      if (Number.isNaN(returnedDate.getTime())) {
        return res.status(400).json({
          message: 'returnedAt must be a valid date or null',
        });
      }
    }

    const loan = await updateLoan(id, {
      userId,
      bookId,
      borrowedAt: borrowedDate,
      dueDate: dueDateValue,
      returnedAt: returnedDate,
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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

    const {
      userId,
      bookId,
      borrowedAt,
      dueDate,
      returnedAt,
    } = req.body;

    if (
      userId === undefined &&
      bookId === undefined &&
      borrowedAt === undefined &&
      dueDate === undefined &&
      returnedAt === undefined
    ) {
      return res.status(400).json({
        message: 'PATCH requires at least one field to update',
      });
    }

    const existingLoan = await getLoanById(id);

    if (!existingLoan) {
      return res.status(404).json({
        message: 'Loan not found',
      });
    }

    const data = {};

    if (userId !== undefined) {
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
          message: 'userId must be a positive integer',
        });
      }

      if (!(await userExists(userId))) {
        return res.status(404).json({
          message: 'User not found',
        });
      }

      data.userId = userId;
    }

    if (bookId !== undefined) {
      if (!Number.isInteger(bookId) || bookId <= 0) {
        return res.status(400).json({
          message: 'bookId must be a positive integer',
        });
      }

      if (!(await bookExists(bookId))) {
        return res.status(404).json({
          message: 'Book not found',
        });
      }

      data.bookId = bookId;
    }

    if (borrowedAt !== undefined) {
      const date = new Date(borrowedAt);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          message: 'borrowedAt must be a valid date',
        });
      }

      data.borrowedAt = date;
    }

    if (dueDate !== undefined) {
      const date = new Date(dueDate);

      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({
          message: 'dueDate must be a valid date',
        });
      }

      data.dueDate = date;
    }

    if (returnedAt !== undefined) {
      if (returnedAt === null) {
        data.returnedAt = null;
      } else {
        const date = new Date(returnedAt);

        if (Number.isNaN(date.getTime())) {
          return res.status(400).json({
            message: 'returnedAt must be a valid date or null',
          });
        }

        data.returnedAt = date;
      }
    }

    const loan = await patchLoan(id, data);

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
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

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

    if (
      id === undefined &&
      userId === undefined &&
      bookId === undefined &&
      borrowedAt === undefined &&
      dueDate === undefined &&
      returnedAt === undefined
    ) {
      return res.status(400).json({
        message: 'QUERY requires at least one query criterion',
      });
    }

    if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({
        message: 'id must be a positive integer',
      });
    }

    if (
      userId !== undefined &&
      (!Number.isInteger(userId) || userId <= 0)
    ) {
      return res.status(400).json({
        message: 'userId must be a positive integer',
      });
    }

    if (
      bookId !== undefined &&
      (!Number.isInteger(bookId) || bookId <= 0)
    ) {
      return res.status(400).json({
        message: 'bookId must be a positive integer',
      });
    }

    let borrowedDate;

    if (borrowedAt !== undefined) {
      borrowedDate = new Date(borrowedAt);

      if (Number.isNaN(borrowedDate.getTime())) {
        return res.status(400).json({
          message: 'borrowedAt must be a valid date',
        });
      }
    }

    let dueDateValue;

    if (dueDate !== undefined) {
      dueDateValue = new Date(dueDate);

      if (Number.isNaN(dueDateValue.getTime())) {
        return res.status(400).json({
          message: 'dueDate must be a valid date',
        });
      }
    }

    let returnedDate;

    if (returnedAt !== undefined) {
      if (returnedAt === null) {
        returnedDate = null;
      } else {
        returnedDate = new Date(returnedAt);

        if (Number.isNaN(returnedDate.getTime())) {
          return res.status(400).json({
            message: 'returnedAt must be a valid date or null',
          });
        }
      }
    }

    const loans = await queryLoans({
      id,
      userId,
      bookId,
      borrowedAt: borrowedDate,
      dueDate: dueDateValue,
      returnedAt: returnedDate,
    });

    return res.status(200).json(loans);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Error querying loans',
    });
  }
};