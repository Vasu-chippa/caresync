import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV === 'development';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many API requests. Please try again later.',
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 300 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication requests. Please try again later.',
  },
});

export const otpRequestRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDevelopment ? 30 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || 'unknown-ip');
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `${ip}:${email}`;
  },
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again in a few minutes.',
  },
});
