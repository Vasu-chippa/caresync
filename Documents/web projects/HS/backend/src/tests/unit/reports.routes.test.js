import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let reportRouter;
let reportService;

const ACCESS_SECRET = 'reports-test-access-secret-1234567890';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'reports-test-refresh-secret-1234567890';
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

  ({ reportRouter } = await import('../../modules/reports/report.routes.js'));
  ({ reportService } = await import('../../modules/reports/report.service.js'));
});

beforeEach(() => {
  reportService.upload = async ({ file }) => ({
    report: {
      reportId: 'RPT-1',
      originalName: file.originalname,
    },
  });
  reportService.list = async () => ({
    items: [{ reportId: 'RPT-1', title: 'CBC Report' }],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  });
  reportService.getForDownload = async () => ({
    reportId: 'RPT-1',
    fileName: 'dummy.pdf',
    originalName: 'dummy.pdf',
  });
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

const appFactory = () => {
  const app = express();
  app.use('/api/v1/reports', reportRouter);

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  });

  return app;
};

test('upload blocked without auth', async () => {
  const app = appFactory();

  const res = await request(app)
    .post('/api/v1/reports/upload')
    .field('title', 'CBC Report')
    .field('reportType', 'lab');

  assert.equal(res.status, 401);
});

test('doctor can upload report', async () => {
  const app = appFactory();
  const token = tokenFor('doctor', '507f191e810c19729de860eb');

  const res = await request(app)
    .post('/api/v1/reports/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'CBC Report')
    .field('reportType', 'lab')
    .field('patientId', '507f191e810c19729de860ea')
    .field('doctorId', '507f191e810c19729de860eb')
    .attach('file', Buffer.from('fake pdf binary'), 'report.pdf');

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
});

test('patient list access works', async () => {
  const app = appFactory();
  const token = tokenFor('patient');

  const res = await request(app)
    .get('/api/v1/reports')
    .set('Authorization', `Bearer ${token}`)
    .query({ page: 1, limit: 10 });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});
