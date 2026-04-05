import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const prescriptionValidation = {
  create: Joi.object({
    appointmentId: Joi.string().trim().required(),
    patientId: objectId.required(),
    doctorId: objectId.required(),
    diagnosis: Joi.string().trim().min(3).max(300).required(),
    medicines: Joi.array()
      .items(
        Joi.object({
          medicine: Joi.string().trim().min(2).max(120).required(),
          dosage: Joi.string().trim().min(2).max(80).required(),
          frequency: Joi.string().trim().min(2).max(80).required(),
          time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
          durationDays: Joi.number().integer().min(1).max(365).required(),
          notes: Joi.string().trim().max(300).optional(),
        })
      )
      .min(1)
      .required(),
    advice: Joi.string().trim().max(500).optional(),
  }),
  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    patientId: objectId.optional(),
    doctorId: objectId.optional(),
  }),
  recordAdherence: Joi.object({
    medicineIndex: Joi.number().integer().min(0).required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    taken: Joi.boolean().required(),
  }),
  update: Joi.object({
    diagnosis: Joi.string().trim().min(3).max(300).required(),
    medicines: Joi.array()
      .items(
        Joi.object({
          medicine: Joi.string().trim().min(2).max(120).required(),
          dosage: Joi.string().trim().min(2).max(80).required(),
          frequency: Joi.string().trim().min(2).max(80).required(),
          time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
          durationDays: Joi.number().integer().min(1).max(365).required(),
          notes: Joi.string().trim().max(300).optional(),
        })
      )
      .min(1)
      .required(),
    advice: Joi.string().trim().max(500).optional(),
  }),
};
