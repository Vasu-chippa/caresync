import { Router } from 'express';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { ApiResponse } from '../utils/ApiResponse.js';
import { metrics } from '../config/metrics.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { appointmentRouter } from '../modules/appointments/appointment.routes.js';
import { prescriptionRouter } from '../modules/prescriptions/prescription.routes.js';
import { billingRouter } from '../modules/billing/billing.routes.js';
import { reportRouter } from '../modules/reports/report.routes.js';
import { analyticsRouter } from '../modules/analytics/analytics.routes.js';
import { doctorRouter } from '../modules/doctors/doctor.routes.js';
import ratingRoutes from '../modules/ratings/rating.routes.js';

const router = Router();
const openApiSpecPath = fileURLToPath(new URL('../docs/openapi.yaml', import.meta.url));
const openApiSpec = YAML.load(openApiSpecPath);

router.get('/health', (req, res) => {
  return ApiResponse.success(
    res,
    {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
    'Backend is healthy'
  );
});

router.get('/metrics', (req, res) => {
  return ApiResponse.success(
    res,
    {
      ...metrics.snapshot(),
      requestId: req.requestId,
    },
    'Runtime metrics fetched'
  );
});

router.get('/openapi.json', (_req, res) => {
  return res.json(openApiSpec);
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

router.use('/auth', authRouter);
router.use('/appointments', appointmentRouter);
router.use('/prescriptions', prescriptionRouter);
router.use('/billing', billingRouter);
router.use('/reports', reportRouter);
router.use('/analytics', analyticsRouter);
router.use('/doctors', doctorRouter);
router.use('/ratings', ratingRoutes);

export default router;
