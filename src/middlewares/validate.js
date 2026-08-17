export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: result.error.issues,
      });
    }

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }

    if (result.data.params !== undefined) {
      req.params = result.data.params;
    }

    next();
  };
};