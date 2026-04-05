import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const ROLES = ['admin', 'doctor', 'patient'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'patient',
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    avatarPath: {
      type: String,
      default: null,
      trim: true,
      maxlength: 255,
    },
    avatarPublicId: {
      type: String,
      default: null,
      trim: true,
      maxlength: 255,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true, name: 'uniq_user_email' });
userSchema.index({ role: 1, isVerified: 1 }, { name: 'idx_role_verified' });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export const UserModel = mongoose.model('User', userSchema);
