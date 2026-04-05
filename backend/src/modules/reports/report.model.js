import crypto from 'crypto';
import mongoose from 'mongoose';

const reportTypes = ['lab', 'radiology', 'discharge', 'clinical', 'other'];

const reportSchema = new mongoose.Schema(
  {
    reportId: {
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
      index: true,
      default: null,
    },
    appointmentId: {
      type: String,
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    reportType: {
      type: String,
      enum: reportTypes,
      default: 'other',
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    filePublicId: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportSchema.index({ patientId: 1, createdAt: -1 }, { name: 'idx_report_patient_created' });
reportSchema.index({ doctorId: 1, createdAt: -1 }, { name: 'idx_report_doctor_created' });
reportSchema.index({ reportType: 1, createdAt: -1 }, { name: 'idx_report_type_created' });

reportSchema.pre('validate', function setReportId(next) {
  if (!this.reportId) {
    this.reportId = `RPT-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }
  next();
});

export const ReportModel = mongoose.model('Report', reportSchema);
