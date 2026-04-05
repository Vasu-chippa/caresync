import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateQuery } from '../../middleware/validateQuery.middleware.js';
import { analyticsController } from './analytics.controller.js';
import { analyticsValidation } from './analytics.validation.js';

const analyticsRouter = Router();

analyticsRouter.use(authenticateAccessToken);

analyticsRouter.get(
  '/admin',
  authorizeRoles('admin'),
  validateQuery(analyticsValidation.query),
  analyticsController.admin
);

analyticsRouter.get(
  '/admin/earnings',
  authorizeRoles('admin'),
  validateQuery(analyticsValidation.query),
  analyticsController.adminEarnings
);

analyticsRouter.get(
  '/doctor',
  authorizeRoles('doctor', 'admin'),
  validateQuery(analyticsValidation.query),
  analyticsController.doctor
);

export { analyticsRouter };
