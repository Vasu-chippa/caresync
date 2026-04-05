import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let prescriptionRouter;
let prescriptionService;

const ACCESS_SECRET = 'prescriptions-test-access-secret-1234567890';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'prescriptions-test-refresh-secret-1234567890';
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

  ({ prescriptionRouter } = await import('../../modules/prescriptions/prescription.routes.js'));
  ({ prescriptionService } = await import('../../modules/prescriptions/prescription.service.js'));
});

beforeEach(() => {
  prescriptionService.create = async ({ payload }) => ({
    prescription: {
      prescriptionId: 'PRX-1',
      appointmentId: payload.appointmentId,
      status: 'created',
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
  app.use('/api/v1/prescriptions', prescriptionRouter);
  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ message: error.message });
  });
  return app;
};

test('doctor can create prescription', async () => {
  const app = appFactory();
  const token = tokenFor('doctor', '507f191e810c19729de860eb');

  const res = await request(app)
    .post('/api/v1/prescriptions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      appointmentId: 'APT-1',
      patientId: '507f191e810c19729de860ea',
      doctorId: '507f191e810c19729de860eb',
      diagnosis: 'Mild fever',
      medicines: [
        {
          medicine: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Twice daily',
          durationDays: 3,
        },
      ],
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
});

test('patient cannot create prescription', async () => {
  const app = appFactory();
  const token = tokenFor('patient');

  const res = await request(app)
    .post('/api/v1/prescriptions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      appointmentId: 'APT-1',
      patientId: '507f191e810c19729de860ea',
      doctorId: '507f191e810c19729de860eb',
      diagnosis: 'Mild fever',
      medicines: [
        {
          medicine: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Twice daily',
          durationDays: 3,
        },
      ],
    });

  assert.equal(res.status, 403);
});
