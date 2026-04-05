import mongoose from 'mongoose';

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
      max: 70,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    appointmentFee: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const DoctorProfileModel = mongoose.model('DoctorProfile', doctorProfileSchema);
