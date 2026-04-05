import Joi from 'joi';

export const ratingValidation = {
  create: Joi.object({
    doctorId: Joi.string().required().custom((value, helpers) => {
      if (!value.match(/^[0-9a-fA-F]{24}$/)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
    appointmentId: Joi.string().trim().min(3).required(),
    overallRating: Joi.number().integer().min(1).max(5).required(),
    professionalism: Joi.number().integer().min(1).max(5).required(),
    bedideManner: Joi.number().integer().min(1).max(5).required(),
    clearExplanations: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().max(500).allow(''),
    isAnonymous: Joi.boolean().default(false),
  }),
  update: Joi.object({
    overallRating: Joi.number().integer().min(1).max(5),
    professionalism: Joi.number().integer().min(1).max(5),
    bedideManner: Joi.number().integer().min(1).max(5),
    clearExplanations: Joi.number().integer().min(1).max(5),
    comment: Joi.string().max(500).allow(''),
    isAnonymous: Joi.boolean(),
  }),
};
