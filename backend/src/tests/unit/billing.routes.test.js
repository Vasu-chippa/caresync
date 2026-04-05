import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let billingRouter;
let billingService;

const ACCESS_SECRET = 'billing-test-access-secret-1234567890';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'billing-test-refresh-secret-1234567890';
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

  ({ billingRouter } = await import('../../modules/billing/billing.routes.js'));
  ({ billingService } = await import('../../modules/billing/billing.service.js'));
});

beforeEach(() => {
  billingService.createInvoice = async ({ payload }) => ({
    invoice: {
      invoiceId: 'INV-1',
      appointmentId: payload.appointmentId,
      paymentStatus: 'pending',
    },
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
  app.use(express.json());
  app.use('/api/v1/billing', billingRouter);
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  });
  return app;
};

test('admin can create invoice', async () => {
  const app = appFactory();
  const token = tokenFor('admin');

  const res = await request(app)
    .post('/api/v1/billing/invoices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      appointmentId: 'APT-1',
      patientId: '507f191e810c19729de860ea',
      doctorId: '507f191e810c19729de860eb',
      amount: 99.5,
      currency: 'USD',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
});

test('patient cannot create invoice', async () => {
  const app = appFactory();
  const token = tokenFor('patient');

  const res = await request(app)
    .post('/api/v1/billing/invoices')
    .set('Authorization', `Bearer ${token}`)
    .send({
      appointmentId: 'APT-1',
      patientId: '507f191e810c19729de860ea',
      doctorId: '507f191e810c19729de860eb',
      amount: 99.5,
      currency: 'USD',
    });

  assert.equal(res.status, 403);
});
