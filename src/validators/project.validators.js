const Joi = require('joi');

const createProjectSchema = Joi.object({
  title: Joi.string().trim().min(3).max(120).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 3 characters long',
    'string.max': 'Title cannot exceed 120 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().trim().min(10).max(5000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be at least 10 characters long',
    'string.max': 'Description cannot exceed 5000 characters',
    'any.required': 'Description is required',
  }),
});

module.exports = {
  createProjectSchema,
};
