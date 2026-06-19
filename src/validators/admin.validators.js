const Joi = require('joi');

const reviewKycSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required().messages({
    'any.only': "Status must be either 'approved' or 'rejected'",
    'any.required': 'Status is required',
  }),
  reviewNote: Joi.string().trim().max(1000).messages({
    'string.max': 'Review note cannot exceed 1000 characters',
  }),
});

module.exports = {
  reviewKycSchema,
};
