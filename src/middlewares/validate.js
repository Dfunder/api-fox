/**
 * Validation middleware factory
 * Validates request body against a Joi schema
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const err = new Error(error.details.map((d) => d.message).join(', '));
    err.statusCode = 400;
    err.isOperational = true;
    return next(err);
  }
  next();
};

module.exports = validate;