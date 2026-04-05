import test, { before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let appointmentRouter;
let appointmentService;
let ApiError;

const ACCESS_SECRET = 'appointments-test-access-secret-1234567890';

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.USE_IN_MEMORY_REDIS = 'true';
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'appointments-test-refresh-secret-1234567890';
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

  ({ appointmentRouter } = await import('../../modules/appointments/appointment.routes.js'));
  ({ appointmentService } = await import('../../modules/appointments/appointment.service.js'));
  ({ ApiError } = await import('../../utils/ApiError.js'));
});

beforeEach(() => {
  appointmentService.book = async ({ auth, payload }) => ({
    appointment: {
      appointmentId: 'APT-20260330-ABC123',
      patientId: auth.userId,
      doctorId: payload.doctorId,
      date: payload.date,
      timeSlot: payload.timeSlot,
      status: 'booked',
    },
  });
});

const issueAccessToken = ({ userId, role }) => {
  return jwt.sign(
    {
      sub: userId,
      role,
      email: `${role}@hms.test`,
      type: 'access',
    },
    ACCESS_SECRET,
    { expiresIn: '5m' }
  );
};

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/appointments', appointmentRouter);

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  });

  return app;
};

test('booking success for patient role', async () => {
  const app = createApp();
  const token = issueAccessToken({ userId: '507f191e810c19729de860ea', role: 'patient' });

  const response = await request(app)
    .post('/api/v1/appointments/book')
    .set('Authorization', `Bearer ${token}`)
    .send({
      doctorId: '507f191e810c19729de860eb',
      date: '2026-04-01',
      timeSlot: '09:00-09:30',
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.appointment.status, 'booked');
});

test('double booking prevention returns 409', async () => {
  appointmentService.book = async () => {
    throw new ApiError('Selected time slot is already booked', 409);
  };

  const app = createApp();
  const token = issueAccessToken({ userId: '507f191e810c19729de860ea', role: 'patient' });

  const response = await request(app)
    .post('/api/v1/appointments/book')
    .set('Authorization', `Bearer ${token}`)
    .send({
      doctorId: '507f191e810c19729de860eb',
      date: '2026-04-01',
      timeSlot: '09:00-09:30',
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.message, 'Selected time slot is already booked');
});

test('unauthorized access is blocked', async () => {
  const app = createApp();

  const response = await request(app).post('/api/v1/appointments/book').send({
    doctorId: '507f191e810c19729de860eb',
    date: '2026-04-01',
    timeSlot: '09:00-09:30',
  });

  assert.equal(response.status, 401);
});

test('role restriction blocks doctor from booking endpoint', async () => {
  const app = createApp();
  const doctorToken = issueAccessToken({ userId: '507f191e810c19729de860eb', role: 'doctor' });

  const response = await request(app)
    .post('/api/v1/appointments/book')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({
      doctorId: '507f191e810c19729de860eb',
      date: '2026-04-01',
      timeSlot: '09:00-09:30',
    });

  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'Forbidden: insufficient permissions');
});
