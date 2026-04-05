import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authController } from './auth.controller.js';
import { authValidation } from './auth.validation.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { authRateLimiter, otpRequestRateLimiter } from '../../config/rateLimit.js';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { ApiError } from '../../utils/ApiError.js';

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 3 * 1024 * 1024,
	},
	fileFilter: (_req, file, cb) => {
		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
		const ext = path.extname(path.basename(file.originalname)).toLowerCase();
		const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];

		if (!allowedMimeTypes.includes(file.mimetype) || !allowedExt.includes(ext)) {
			return cb(new ApiError('Only JPG, PNG, or WEBP images are allowed', 400));
		}

		return cb(null, true);
	},
});

const authRouter = Router();

authRouter.get('/status', authController.status);
authRouter.post(
	'/register/otp',
	authRateLimiter,
	otpRequestRateLimiter,
	validateBody(authValidation.requestRegisterOtp),
	authController.requestRegisterOtp
);
authRouter.post(
	'/register/verify',
	authRateLimiter,
	validateBody(authValidation.verifyRegisterOtp),
	authController.verifyRegisterOtp
);
authRouter.post('/login', authRateLimiter, validateBody(authValidation.login), authController.login);
authRouter.post('/refresh', authRateLimiter, validateBody(authValidation.refresh), authController.refresh);
authRouter.post('/logout', authRateLimiter, validateBody(authValidation.logout), authController.logout);
authRouter.get('/me', authenticateAccessToken, authController.me);
authRouter.patch(
	'/me',
	authenticateAccessToken,
	avatarUpload.single('avatar'),
	validateBody(authValidation.updateProfile),
	authController.updateMe
);
authRouter.get('/sessions', authenticateAccessToken, authController.listSessions);
authRouter.delete(
	'/sessions/revoke',
	authenticateAccessToken,
	validateBody(authValidation.revokeSession),
	authController.revokeSession
);
authRouter.post(
	'/forgot-password/otp',
	authRateLimiter,
	otpRequestRateLimiter,
	validateBody(authValidation.requestPasswordResetOtp),
	authController.requestForgotPasswordOtp
);
authRouter.post(
	'/forgot-password/verify',
	authRateLimiter,
	validateBody(authValidation.verifyPasswordResetOtp),
	authController.verifyForgotPasswordOtp
);
authRouter.post(
	'/forgot-password/reset',
	authRateLimiter,
	validateBody(authValidation.resetPassword),
	authController.resetPassword
);

export { authRouter };
