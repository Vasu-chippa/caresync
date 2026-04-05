import test, { before } from 'node:test';
import assert from 'node:assert/strict';

let jwtService;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = 'auth-session-test-access-secret-1234567890';
  process.env.JWT_REFRESH_SECRET = 'auth-session-test-refresh-secret-1234567890';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/hms-test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.SMTP_HOST = 'smtp.test.local';
  process.env.SMTP_PORT = '2525';
  process.env.SMTP_USER = 'test';
  process.env.SMTP_PASS = 'test';
  process.env.SMTP_FROM = 'no-reply@test.com';

  ({ jwtService } = await import('../../services/jwt.service.js'));
});

test('refresh token rotation issues new token and blocks reuse of old token', async () => {
  const userId = `user-${Date.now()}`;
  const user = {
    _id: userId,
    role: 'patient',
    email: `${userId}@example.com`,
  };

  const first = await jwtService.issueRefreshToken(user, {
    ip: '127.0.0.1',
    userAgent: 'node-test',
  });

  const rotated = await jwtService.rotateRefreshToken(first.token, {
    ip: '127.0.0.2',
    userAgent: 'node-test-2',
  });

  assert.equal(rotated.ok, true);
  assert.ok(rotated.refreshToken);
  assert.notEqual(rotated.refreshToken, first.token);

  const reuse = await jwtService.rotateRefreshToken(first.token, {
    ip: '127.0.0.3',
    userAgent: 'attacker',
  });

  assert.equal(reuse.ok, false);
  assert.equal(reuse.reason, 'token_reuse_detected');
});

test('session list and revoke flow works', async () => {
  const userId = `user-${Date.now()}-2`;
  const user = {
    _id: userId,
    role: 'doctor',
    email: `${userId}@example.com`,
  };

  const issued = await jwtService.issueRefreshToken(user, {
    ip: '10.0.0.1',
    userAgent: 'device-1',
  });

  const sessionsBefore = await jwtService.listSessions(userId);
  assert.equal(sessionsBefore.length, 1);

  const revoked = await jwtService.revokeSessionByRefreshToken(issued.token);
  assert.equal(revoked, true);

  const sessionsAfter = await jwtService.listSessions(userId);
  assert.equal(sessionsAfter.length, 0);
});
