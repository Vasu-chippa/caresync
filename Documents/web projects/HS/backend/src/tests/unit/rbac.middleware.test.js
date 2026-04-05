import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

let authenticateAccessToken;
let authorizeRoles;

const SECRET = 'rbac-test-secret-very-long-string-1234567890';

before(async () => {
  process.env.JWT_ACCESS_SECRET = SECRET;

  const authModule = await import('../../middleware/auth.middleware.js');
  const roleModule = await import('../../middleware/role.middleware.js');

  authenticateAccessToken = authModule.authenticateAccessToken;
  authorizeRoles = roleModule.authorizeRoles;
});

const createApp = () => {
  const app = express();

  app.get(
    '/secure/admin',
    authenticateAccessToken,
    authorizeRoles('admin'),
    (_req, res) => {
      res.status(200).json({ ok: true });
    }
  );

  app.use((error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  });

  return app;
};

const issueAccessToken = (role) => {
  return jwt.sign(
    {
      sub: 'user-1',
      role,
      email: 'test@example.com',
      type: 'access',
    },
    SECRET,
    { expiresIn: '5m' }
  );
};

test('Unauthorized access is blocked with 401', async () => {
  const app = createApp();

  const response = await request(app).get('/secure/admin');

  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Authentication required');
});

test('Wrong role is blocked with 403', async () => {
  const app = createApp();
  const patientToken = issueAccessToken('patient');

  const response = await request(app)
    .get('/secure/admin')
    .set('Authorization', `Bearer ${patientToken}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'Forbidden: insufficient permissions');
});

test('Valid role gets successful response', async () => {
  const app = createApp();
  const adminToken = issueAccessToken('admin');

  const response = await request(app)
    .get('/secure/admin')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});
