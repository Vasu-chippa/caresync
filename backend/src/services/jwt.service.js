import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { redisClient } from '../config/redis.js';

class JwtService {
  sessionRegistryKey(userId) {
    return `auth:sessions:user:${userId}`;
  }

  sessionMetaKey(sessionId) {
    return `auth:session:${sessionId}`;
  }

  sessionTokenKey(sessionId) {
    return `auth:refresh:${sessionId}`;
  }

  async safeGet(key) {
    try {
      return await redisClient.get(key);
    } catch (_error) {
      return null;
    }
  }

  async safeSet(key, value, ttlSeconds) {
    await redisClient.set(key, value, 'EX', ttlSeconds);
  }

  async safeDel(...keys) {
    const flat = keys.flat().filter(Boolean);
    if (!flat.length) return;
    await redisClient.del(flat);
  }

  async safeSAdd(key, value) {
    await redisClient.sadd(key, value);
  }

  async safeSRem(key, value) {
    await redisClient.srem(key, value);
  }

  async safeSMembers(key) {
    return redisClient.smembers(key);
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  calculateTtl(token) {
    const decoded = jwt.decode(token);
    return Math.max((decoded?.exp || 0) - Math.floor(Date.now() / 1000), 1);
  }

  decodeRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }

  issueAccessToken(user) {
    return jwt.sign(
      {
        sub: String(user._id),
        role: user.role,
        email: user.email,
        type: 'access',
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );
  }

  async createSession(user, metadata = {}) {
    const sessionId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await this.safeSAdd(this.sessionRegistryKey(user._id), sessionId);

    return {
      sessionId,
      userId: String(user._id),
      role: user.role,
      email: user.email,
      ip: metadata.ip || null,
      userAgent: metadata.userAgent || null,
      createdAt,
      lastUsedAt: createdAt,
      revokedAt: null,
    };
  }

  issueRefreshTokenPayload(session) {
    return {
      sub: String(session.userId),
      role: session.role,
      type: 'refresh',
      sid: session.sessionId,
      rid: crypto.randomUUID(),
    };
  }

  async persistSessionAndRefreshToken(session, refreshToken) {
    const ttlSeconds = this.calculateTtl(refreshToken);
    const sessionMeta = {
      ...session,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    await Promise.all([
      this.safeSet(this.sessionMetaKey(session.sessionId), JSON.stringify(sessionMeta), ttlSeconds),
      this.safeSet(this.sessionTokenKey(session.sessionId), this.hashToken(refreshToken), ttlSeconds),
    ]);

    return ttlSeconds;
  }

  async issueRefreshToken(user, metadata = {}, sessionId = null) {
    let session;

    if (sessionId) {
      const existing = await this.getSessionMeta(sessionId);

      if (!existing || existing.revokedAt) {
        throw new Error('Session not found for refresh rotation');
      }

      session = {
        ...existing,
        ip: metadata.ip || existing.ip || null,
        userAgent: metadata.userAgent || existing.userAgent || null,
        lastUsedAt: new Date().toISOString(),
        revokedAt: null,
      };
    } else {
      session = await this.createSession(user, metadata);
    }

    const token = jwt.sign(
      this.issueRefreshTokenPayload(session),
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    const ttlSeconds = await this.persistSessionAndRefreshToken(session, token);

    return {
      token,
      sessionId: session.sessionId,
      ttlSeconds,
    };
  }

  async getSessionMeta(sessionId) {
    const raw = await this.safeGet(this.sessionMetaKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async rotateRefreshToken(refreshToken, metadata = {}) {
    let payload;

    try {
      payload = this.decodeRefreshToken(refreshToken);
    } catch (_error) {
      return { ok: false, reason: 'invalid_refresh_token' };
    }

    if (payload.type !== 'refresh' || !payload.sid || !payload.sub) {
      return { ok: false, reason: 'invalid_refresh_token' };
    }

    const sessionId = payload.sid;
    const expectedHash = await this.safeGet(this.sessionTokenKey(sessionId));

    if (!expectedHash) {
      return { ok: false, reason: 'revoked_or_expired' };
    }

    const incomingHash = this.hashToken(refreshToken);

    if (incomingHash !== expectedHash) {
      await this.revokeSessionById(payload.sub, sessionId);
      return { ok: false, reason: 'token_reuse_detected' };
    }

    const session = await this.getSessionMeta(sessionId);
    if (!session || session.revokedAt) {
      return { ok: false, reason: 'revoked_or_expired' };
    }

    const nextSession = {
      ...session,
      ip: metadata.ip || session.ip,
      userAgent: metadata.userAgent || session.userAgent,
      lastUsedAt: new Date().toISOString(),
      revokedAt: null,
    };

    const user = {
      _id: session.userId,
      role: session.role,
      email: session.email,
    };

    const accessToken = this.issueAccessToken(user);
    const refresh = await this.issueRefreshToken(user, metadata, sessionId);

    return {
      ok: true,
      sessionId,
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresInSeconds: refresh.ttlSeconds,
    };
  }

  async revokeSessionById(userId, sessionId) {
    const meta = await this.getSessionMeta(sessionId);

    if (!meta) {
      await this.safeSRem(this.sessionRegistryKey(userId), sessionId);
      return false;
    }

    if (String(meta.userId) !== String(userId)) {
      return false;
    }

    await Promise.all([
      this.safeDel(this.sessionMetaKey(sessionId), this.sessionTokenKey(sessionId)),
      this.safeSRem(this.sessionRegistryKey(userId), sessionId),
    ]);

    return true;
  }

  async revokeSessionByRefreshToken(refreshToken) {
    let payload;
    try {
      payload = this.decodeRefreshToken(refreshToken);
    } catch (_error) {
      return false;
    }

    if (!payload?.sub || !payload?.sid) {
      return false;
    }

    return this.revokeSessionById(payload.sub, payload.sid);
  }

  async listSessions(userId) {
    const ids = await this.safeSMembers(this.sessionRegistryKey(userId));
    if (!ids.length) {
      return [];
    }

    const sessions = await Promise.all(ids.map((id) => this.getSessionMeta(id)));

    return sessions
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime());
  }
}

export const jwtService = new JwtService();
