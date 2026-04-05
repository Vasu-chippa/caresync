import { Router } from 'express';
import { appointmentController } from './appointment.controller.js';
import { appointmentValidation } from './appointment.validation.js';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateQuery } from '../../middleware/validateQuery.middleware.js';

const appointmentRouter = Router();

appointmentRouter.use(authenticateAccessToken);

appointmentRouter.get(
  '/availability',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateQuery(appointmentValidation.availability),
  appointmentController.getAvailability
);

appointmentRouter.post(
  '/book',
  authorizeRoles('admin', 'patient'),
  validateBody(appointmentValidation.book),
  appointmentController.book
);

appointmentRouter.get(
  '/',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateQuery(appointmentValidation.list),
  appointmentController.list
);

appointmentRouter.patch(
  '/reschedule',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateBody(appointmentValidation.reschedule),
  appointmentController.reschedule
);

appointmentRouter.patch(
  '/respond',
  authorizeRoles('admin', 'doctor'),
  validateBody(appointmentValidation.respond),
  appointmentController.respond
);

// Backward-compatible alias for clients sending POST instead of PATCH.
appointmentRouter.post(
  '/respond',
  authorizeRoles('admin', 'doctor'),
  validateBody(appointmentValidation.respond),
  appointmentController.respond
);

appointmentRouter.delete(
  '/cancel',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateBody(appointmentValidation.cancel),
  appointmentController.cancel
);

export { appointmentRouter };
