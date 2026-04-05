import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

const enabled = process.env.RUN_INTEGRATION === 'true';

let app;
let redisClient;
let AppointmentModel;
let jwtService;

const requiredEnvDefaults = {
  NODE_ENV: process.env.NODE_ENV || 'test',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'integration-access-secret-1234567890',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'integration-refresh-secret-1234567890',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.test.local',
  SMTP_PORT: process.env.SMTP_PORT || '2525',
  SMTP_USER: process.env.SMTP_USER || 'test',
  SMTP_PASS: process.env.SMTP_PASS || 'test',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply@test.com',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/hms-integration',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};

for (const [key, value] of Object.entries(requiredEnvDefaults)) {
  if (!process.env[key]) {
    process.env[key] = String(value);
  }
}

const accessTokenFor = ({ role, userId }) => {
  return jwt.sign(
    {
      sub: userId,
      role,
      email: `${role}@integration.test`,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
};

before(async () => {
  if (!enabled) {
    return;
  }

  ({ default: app } = await import('../../app.js'));
  ({ redisClient } = await import('../../config/redis.js'));
  ({ AppointmentModel } = await import('../../modules/appointments/appointment.model.js'));
  ({ jwtService } = await import('../../services/jwt.service.js'));

  await mongoose.connect(process.env.MONGODB_URI);
});

beforeEach(async () => {
  if (!enabled) {
    return;
  }

  await AppointmentModel.deleteMany({});
  if (redisClient.flushall) {
    await redisClient.flushall();
  }
});

test('integration: concurrent appointment booking allows only one active slot', { skip: !enabled }, async () => {
  const patientId = new mongoose.Types.ObjectId().toString();
  const doctorId = new mongoose.Types.ObjectId().toString();
  const token = accessTokenFor({ role: 'patient', userId: patientId });

  const payload = {
    doctorId,
    date: '2026-04-21',
    timeSlot: '09:00-09:30',
  };

  const [r1, r2] = await Promise.all([
    request(app).post('/api/v1/appointments/book').set('Authorization', `Bearer ${token}`).send(payload),
    request(app).post('/api/v1/appointments/book').set('Authorization', `Bearer ${token}`).send(payload),
  ]);

  const statuses = [r1.status, r2.status].sort((a, b) => a - b);
  assert.deepEqual(statuses, [201, 409]);
});

test('integration: availability cache invalidates after booking', { skip: !enabled }, async () => {
  const patientId = new mongoose.Types.ObjectId().toString();
  const doctorId = new mongoose.Types.ObjectId().toString();
  const token = accessTokenFor({ role: 'patient', userId: patientId });

  const before = await request(app)
    .get('/api/v1/appointments/availability')
    .set('Authorization', `Bearer ${token}`)
    .query({ doctorId, date: '2026-04-22' });

  assert.equal(before.status, 200);
  assert.equal(before.body.data.availableSlots.includes('09:00-09:30'), true);

  const booked = await request(app)
    .post('/api/v1/appointments/book')
    .set('Authorization', `Bearer ${token}`)
    .send({ doctorId, date: '2026-04-22', timeSlot: '09:00-09:30' });

  assert.equal(booked.status, 201);

  const after = await request(app)
    .get('/api/v1/appointments/availability')
    .set('Authorization', `Bearer ${token}`)
    .query({ doctorId, date: '2026-04-22' });

  assert.equal(after.status, 200);
  assert.equal(after.body.data.availableSlots.includes('09:00-09:30'), false);
});

test('integration: refresh token reuse is detected and blocked', { skip: !enabled }, async () => {
  const user = {
    _id: new mongoose.Types.ObjectId().toString(),
    role: 'patient',
    email: 'integration-session@test.com',
  };

  const first = await jwtService.issueRefreshToken(user, {
    ip: '10.10.10.1',
    userAgent: 'integration-device',
  });

  const rotated = await jwtService.rotateRefreshToken(first.token, {
    ip: '10.10.10.2',
    userAgent: 'integration-device-2',
  });

  assert.equal(rotated.ok, true);

  const reused = await jwtService.rotateRefreshToken(first.token, {
    ip: '10.10.10.9',
    userAgent: 'attacker',
  });

  assert.equal(reused.ok, false);
  assert.equal(reused.reason, 'token_reuse_detected');
});
