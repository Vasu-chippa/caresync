import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true, trim: true, maxlength: 120 },
    dosage: { type: String, required: true, trim: true, maxlength: 80 },
    frequency: { type: String, required: true, trim: true, maxlength: 80 },
    time: { type: String, trim: true, match: /^\d{2}:\d{2}$/ },
    durationDays: { type: Number, required: true, min: 1, max: 365 },
    notes: { type: String, trim: true, maxlength: 300 },
    adherence: {
      type: [
        {
          date: { type: String, required: true },
          taken: { type: Boolean, default: null },
          missedAlert: { type: Boolean, default: false },
          reminderSent: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    medicines: {
      type: [prescriptionItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'At least one medicine is required',
      },
    },
    advice: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

prescriptionSchema.index({ patientId: 1, createdAt: -1 }, { name: 'idx_patient_created' });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 }, { name: 'idx_doctor_created' });
prescriptionSchema.index({ appointmentId: 1 }, { unique: true, name: 'uniq_prescription_appointment' });

export const PrescriptionModel = mongoose.model('Prescription', prescriptionSchema);
