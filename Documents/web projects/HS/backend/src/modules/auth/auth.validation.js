import Joi from 'joi';

const email = Joi.string().trim().lowercase().email().required();
const password = Joi.string().min(8).max(128).required();
const role = Joi.string().valid('admin', 'doctor', 'patient');
const otp = Joi.string().pattern(/^\d{6}$/).required();
const resetToken = Joi.string().min(24).required();

export const authValidation = {
  requestRegisterOtp: Joi.object({
    email,
  }),
  verifyRegisterOtp: Joi.object({
    email,
    otp,
    name: Joi.string().trim().min(2).max(80).required(),
    password,
    role,
  }),
  login: Joi.object({
    email,
    password,
  }),
  requestPasswordResetOtp: Joi.object({
    email,
  }),
  verifyPasswordResetOtp: Joi.object({
    email,
    otp,
  }),
  resetPassword: Joi.object({
    email,
    resetToken,
    password,
  }),
  refresh: Joi.object({
    refreshToken: Joi.string().min(20).optional(),
  }),
  logout: Joi.object({
    refreshToken: Joi.string().min(20).optional(),
  }),
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(80).optional(),
  }),
  revokeSession: Joi.object({
    sessionId: Joi.string().guid({ version: ['uuidv4', 'uuidv5'] }).required(),
  }),
};
