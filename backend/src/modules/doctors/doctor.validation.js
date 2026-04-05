import Joi from 'joi';

export const doctorValidation = {
  updateProfile: Joi.object({
    appointmentFee: Joi.number().integer().min(0).required(),
  }),
};