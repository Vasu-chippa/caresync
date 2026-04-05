import Joi from 'joi';

export const analyticsValidation = {
  query: Joi.object({
    days: Joi.number().integer().min(1).max(90).default(14),
  }),
};
