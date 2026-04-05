import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let analyticsRouter;
let analyticsService;

const ACCESS_SECRET = 'analytics-test-access-secret-1234567890';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'analytics-test-refresh-secret-1234567890';
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

  ({ analyticsRouter } = await import('../../modules/analytics/analytics.routes.js'));
  ({ analyticsService } = await import('../../modules/analytics/analytics.service.js'));
});

beforeEach(() => {
  analyticsService.getAdminAnalytics = async () => ({ summary: { totalUsers: 1 }, charts: {}, meta: { days: 14 } });
  analyticsService.getDoctorAnalytics = async () => ({ summary: { totalAppointments: 2 }, charts: {}, meta: { days: 14 } });
});

const tokenFor = (role, userId = '507f191e810c19729de860ea') =>
  jwt.sign(
    {
      sub: userId,
      role,
      email: `${role}@hms.test`,
      type: 'access',
    },
    ACCESS_SECRET,
    { expiresIn: '5m' }
  );

const createApp = () => {
  const app = express();
  app.use('/api/v1/analytics', analyticsRouter);
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  });
  return app;
};

test('admin analytics blocked without auth', async () => {
  const app = createApp();
  const res = await request(app).get('/api/v1/analytics/admin');
  assert.equal(res.status, 401);
});

test('admin analytics blocked for doctor role', async () => {
  const app = createApp();
  const token = tokenFor('doctor');
  const res = await request(app)
    .get('/api/v1/analytics/admin')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('admin analytics returns data for admin', async () => {
  const app = createApp();
  const token = tokenFor('admin');
  const res = await request(app)
    .get('/api/v1/analytics/admin')
    .set('Authorization', `Bearer ${token}`)
    .query({ days: 14 });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('doctor analytics returns data for doctor', async () => {
  const app = createApp();
  const token = tokenFor('doctor', '507f191e810c19729de860eb');
  const res = await request(app)
    .get('/api/v1/analytics/doctor')
    .set('Authorization', `Bearer ${token}`)
    .query({ days: 14 });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
