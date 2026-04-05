import crypto from 'crypto';
import { redisClient } from '../config/redis.js';

const OTP_TTL_SECONDS = 5 * 60;

class OtpService {
  normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  buildKey(email, purpose) {
    const safeEmail = this.normalizeEmail(email);
    return `otp:${purpose}:${safeEmail}`;
  }

  generateOtp() {
    const value = crypto.randomInt(0, 1_000_000);
    return String(value).padStart(6, '0');
  }

  hashOtp(otp, purpose, email) {
    return crypto
      .createHash('sha256')
      .update(`${otp}:${purpose}:${this.normalizeEmail(email)}`)
      .digest('hex');
  }

  async issueOtp({ email, purpose, ttlSeconds = OTP_TTL_SECONDS }) {
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp, purpose, email);
    const key = this.buildKey(email, purpose);

    const payload = JSON.stringify({
      otpHash,
      email: this.normalizeEmail(email),
      purpose,
      createdAt: new Date().toISOString(),
    });

    await redisClient.set(key, payload, 'EX', ttlSeconds);

    return {
      otp,
      ttlSeconds,
    };
  }

  async consumeOtp({ email, purpose, otp }) {
    const key = this.buildKey(email, purpose);
    const stored = await redisClient.get(key);

    if (!stored) {
      return { valid: false, reason: 'expired_or_missing' };
    }

    const parsed = JSON.parse(stored);
    const incomingHash = this.hashOtp(otp, purpose, email);
    const valid = parsed.otpHash === incomingHash;

    if (!valid) {
      return { valid: false, reason: 'invalid_otp' };
    }

    await redisClient.del(key);
    return { valid: true };
  }
}

export const otpService = new OtpService();
export { OTP_TTL_SECONDS };
