import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const billingValidation = {
  createInvoice: Joi.object({
    appointmentId: Joi.string().trim().required(),
    patientId: objectId.required(),
    doctorId: objectId.required(),
    amount: Joi.number().positive().precision(2).required(),
    commissionRate: Joi.number().min(0).max(1).precision(4).optional(),
    currency: Joi.string().trim().length(3).optional(),
  }),
  listInvoices: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed').optional(),
    patientId: objectId.optional(),
    doctorId: objectId.optional(),
  }),
  markPaid: Joi.object({
    invoiceId: Joi.string().trim().required(),
    paymentMethod: Joi.string().valid('upi', 'card', 'netbanking', 'wallet', 'cash').optional(),
    transactionRef: Joi.string().trim().max(120).allow('', null).optional(),
  }),
};
