import crypto from 'crypto';
import mongoose from 'mongoose';

const paymentStatuses = ['pending', 'paid', 'failed'];

const billingSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1,
    },
    platformCommissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    doctorPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    paymentStatus: {
      type: String,
      enum: paymentStatuses,
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'cash'],
      default: null,
    },
    transactionRef: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

billingSchema.index({ patientId: 1, createdAt: -1 }, { name: 'idx_invoice_patient_created' });
billingSchema.index({ doctorId: 1, createdAt: -1 }, { name: 'idx_invoice_doctor_created' });
billingSchema.index({ paymentStatus: 1, createdAt: -1 }, { name: 'idx_invoice_status_created' });

billingSchema.pre('validate', function setInvoiceId(next) {
  if (!this.invoiceId) {
    this.invoiceId = `INV-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
  next();
});

export const BillingModel = mongoose.model('Billing', billingSchema);
