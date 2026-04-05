import { ApiError } from '../../utils/ApiError.js';
import crypto from 'crypto';
import { redisClient } from '../../config/redis.js';
import { UserModel } from './auth.model.js';
import { otpService, OTP_TTL_SECONDS } from '../../services/otp.service.js';
import { emailTemplates } from '../../services/emailTemplates.service.js';
import { emailService } from '../../services/email.service.js';
import { jwtService } from '../../services/jwt.service.js';
import { cloudinary, hasCloudinaryConfig } from '../../config/cloudinary.js';

const RESET_TOKEN_TTL_SECONDS = 10 * 60;

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const resetTokenKey = (email) => {
  return `pwd-reset:${otpService.normalizeEmail(email)}`;
};

const toPublicAvatarUrl = (avatarPath) => {
  return avatarPath || null;
};

class AuthService {
  formatUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      avatarUrl: toPublicAvatarUrl(user.avatarPath),
    };
  }

  async requestRegisterOtp(payload) {
    const email = otpService.normalizeEmail(payload.email);

    const existingUser = await UserModel.findOne({ email })
      .select('_id email isVerified')
      .lean();

    if (existingUser?.isVerified) {
      throw new ApiError('An account with this email already exists', 409);
    }

    const issued = await otpService.issueOtp({
      email,
      purpose: 'register',
      ttlSeconds: OTP_TTL_SECONDS,
    });

    const template = emailTemplates.otp({
      title: 'Verify your HMS account',
      otp: issued.otp,
      expiresInMinutes: Math.floor(issued.ttlSeconds / 60),
    });

    emailService.queue({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      email,
      otpExpiresInSeconds: issued.ttlSeconds,
    };
  }

  async verifyRegisterOtpAndCreateUser(payload) {
    const email = otpService.normalizeEmail(payload.email);

    const existingUser = await UserModel.findOne({ email })
      .select('_id email isVerified')
      .lean();

    if (existingUser?.isVerified) {
      throw new ApiError('An account with this email already exists', 409);
    }

    const consumed = await otpService.consumeOtp({
      email,
      purpose: 'register',
      otp: payload.otp,
    });

    if (!consumed.valid) {
      throw new ApiError('Invalid or expired OTP', 400, {
        reason: consumed.reason,
      });
    }

    try {
      const user = await UserModel.create({
        name: payload.name,
        email,
        password: payload.password,
        role: payload.role || 'patient',
        isVerified: true,
      });

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      if (error?.code === 11000) {
        throw new ApiError('An account with this email already exists', 409);
      }

      throw error;
    }
  }

  async login(payload) {
    const email = otpService.normalizeEmail(payload.email);
    const user = await UserModel.findOne({ email, isVerified: true }).select('+password');

    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    const passwordMatched = await user.comparePassword(payload.password);

    if (!passwordMatched) {
      throw new ApiError('Invalid email or password', 401);
    }

    const accessToken = jwtService.issueAccessToken(user);
    const refresh = await jwtService.issueRefreshToken(user, payload.sessionMeta || {});

    return {
      user: this.formatUser(user),
      tokens: {
        accessToken,
        refreshToken: refresh.token,
        sessionId: refresh.sessionId,
        refreshTokenExpiresInSeconds: refresh.ttlSeconds,
      },
    };
  }

  async refreshSession(payload) {
    const token = payload.refreshToken;

    if (!token) {
      throw new ApiError('Refresh token is required', 401);
    }

    const rotated = await jwtService.rotateRefreshToken(token, payload.sessionMeta || {});

    if (!rotated.ok) {
      throw new ApiError('Invalid or expired refresh token', 401, {
        reason: rotated.reason,
      });
    }

    return {
      tokens: {
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
        sessionId: rotated.sessionId,
        refreshTokenExpiresInSeconds: rotated.refreshTokenExpiresInSeconds,
      },
    };
  }

  async logout(payload) {
    if (!payload.refreshToken) {
      return { loggedOut: true };
    }

    await jwtService.revokeSessionByRefreshToken(payload.refreshToken);

    return { loggedOut: true };
  }

  async getMe(auth) {
    const user = await UserModel.findById(auth.userId)
      .select('_id name email role isVerified createdAt avatarPath')
      .lean();

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        avatarUrl: toPublicAvatarUrl(user.avatarPath),
      },
    };
  }

  async updateMe({ auth, payload, file }) {
    const user = await UserModel.findById(auth.userId).select('_id name email role isVerified createdAt avatarPath avatarPublicId');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (typeof payload?.name === 'string' && payload.name.trim()) {
      user.name = payload.name.trim();
    }

    let previousAvatarPublicId = null;
    if (file) {
      if (!hasCloudinaryConfig) {
        throw new ApiError('Cloudinary is not configured. Please set Cloudinary environment variables.', 500);
      }

      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'hms/avatars',
            resource_type: 'image',
            transformation: [{ width: 512, height: 512, crop: 'fill', gravity: 'face' }],
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      previousAvatarPublicId = user.avatarPublicId || null;
      user.avatarPath = uploaded.secure_url;
      user.avatarPublicId = uploaded.public_id;
    }

    await user.save();

    if (previousAvatarPublicId && previousAvatarPublicId !== user.avatarPublicId) {
      await cloudinary.uploader.destroy(previousAvatarPublicId).catch(() => {});
    }

    return {
      user: this.formatUser(user),
    };
  }

  async listMySessions(auth) {
    const sessions = await jwtService.listSessions(auth.userId);

    return {
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        userAgent: session.userAgent,
        ip: session.ip,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
      })),
    };
  }

  async revokeMySession(auth, sessionId) {
    const revoked = await jwtService.revokeSessionById(auth.userId, sessionId);

    if (!revoked) {
      throw new ApiError('Session not found', 404);
    }

    return { revoked: true };
  }

  async requestForgotPasswordOtp(payload) {
    const email = otpService.normalizeEmail(payload.email);

    const user = await UserModel.findOne({ email, isVerified: true })
      .select('_id email')
      .lean();

    if (!user) {
      return {
        email,
        otpExpiresInSeconds: OTP_TTL_SECONDS,
      };
    }

    const issued = await otpService.issueOtp({
      email,
      purpose: 'forgot-password',
      ttlSeconds: OTP_TTL_SECONDS,
    });

    const template = emailTemplates.otp({
      title: 'Reset your HMS password',
      otp: issued.otp,
      expiresInMinutes: Math.floor(issued.ttlSeconds / 60),
    });

    emailService.queue({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      email,
      otpExpiresInSeconds: issued.ttlSeconds,
    };
  }

  async verifyForgotPasswordOtp(payload) {
    const email = otpService.normalizeEmail(payload.email);

    const user = await UserModel.findOne({ email, isVerified: true })
      .select('_id email')
      .lean();

    if (!user) {
      throw new ApiError('Invalid or expired OTP', 400);
    }

    const consumed = await otpService.consumeOtp({
      email,
      purpose: 'forgot-password',
      otp: payload.otp,
    });

    if (!consumed.valid) {
      throw new ApiError('Invalid or expired OTP', 400, {
        reason: consumed.reason,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await redisClient.set(
      resetTokenKey(email),
      hashResetToken(resetToken),
      'EX',
      RESET_TOKEN_TTL_SECONDS
    );

    return {
      email,
      resetToken,
      resetTokenExpiresInSeconds: RESET_TOKEN_TTL_SECONDS,
    };
  }

  async resetPassword(payload) {
    const email = otpService.normalizeEmail(payload.email);
    const tokenKey = resetTokenKey(email);
    const storedHash = await redisClient.get(tokenKey);

    if (!storedHash || storedHash !== hashResetToken(payload.resetToken)) {
      throw new ApiError('Invalid or expired password reset session', 400);
    }

    const user = await UserModel.findOne({ email, isVerified: true }).select('+password');

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    user.password = payload.password;
    await user.save();

    await redisClient.del(tokenKey);

    return {
      email,
      passwordReset: true,
    };
  }
}

export const authService = new AuthService();
