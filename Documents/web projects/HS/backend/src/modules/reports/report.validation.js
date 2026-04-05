import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const reportValidation = {
  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    patientId: objectId.optional(),
    doctorId: objectId.optional(),
    reportType: Joi.string().valid('lab', 'radiology', 'discharge', 'clinical', 'other').optional(),
  }),
  uploadBody: Joi.object({
    title: Joi.string().trim().min(3).max(150).required(),
    reportType: Joi.string().valid('lab', 'radiology', 'discharge', 'clinical', 'other').required(),
    patientId: objectId.optional(),
    doctorId: objectId.optional(),
    appointmentId: Joi.string().trim().optional(),
  }),
};
