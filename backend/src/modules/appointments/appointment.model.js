import crypto from 'crypto';
import mongoose from 'mongoose';

const APPOINTMENT_STATUS = ['booked', 'accepted', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      unique: true,
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
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}-\d{2}:\d{2}$/,
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUS,
      default: 'booked',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'emergency'],
      default: 'normal',
      index: true,
    },
    appointmentFee: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { name: 'idx_doc_date_slot' });
appointmentSchema.index({ patientId: 1, date: -1 }, { name: 'idx_patient_date' });
appointmentSchema.index({ doctorId: 1, date: 1, status: 1 }, { name: 'idx_doc_date_status' });
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['booked', 'accepted', 'completed'] } },
    name: 'uniq_active_doctor_slot',
  }
);

appointmentSchema.pre('validate', function setAppointmentId() {
  if (!this.appointmentId) {
    const entropy = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dateSegment = this.date ? this.date.replace(/-/g, '') : 'NA';
    this.appointmentId = `APT-${dateSegment}-${entropy}`;
  }
});

export const AppointmentModel = mongoose.model('Appointment', appointmentSchema);
export { APPOINTMENT_STATUS };
