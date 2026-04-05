import Joi from 'joi';

const objectId = Joi.string().hex().length(24);
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required();
const timeSlot = Joi.string().pattern(/^\d{2}:\d{2}-\d{2}:\d{2}$/).required();

export const appointmentValidation = {
  book: Joi.object({
    patientId: objectId.optional(),
    doctorId: objectId.required(),
    date,
    timeSlot,
    priority: Joi.string().valid('normal', 'emergency').optional(),
  }),
  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    status: Joi.string().valid('booked', 'accepted', 'cancelled', 'completed').optional(),
    doctorId: objectId.optional(),
    patientId: objectId.optional(),
    dateFrom: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateTo: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  reschedule: Joi.object({
    appointmentId: Joi.string().required(),
    date,
    timeSlot,
    priority: Joi.string().valid('normal', 'emergency').optional(),
  }),
  cancel: Joi.object({
    appointmentId: Joi.string().required(),
  }),
  respond: Joi.object({
    appointmentId: Joi.string().required(),
    action: Joi.string().valid('accept', 'reject', 'complete').required(),
  }),
  availability: Joi.object({
    doctorId: objectId.required(),
    date,
  }),
};
