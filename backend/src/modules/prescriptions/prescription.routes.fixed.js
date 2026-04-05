import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateQuery } from '../../middleware/validateQuery.middleware.js';
import { prescriptionController } from './prescription.controller.js';
import { prescriptionValidation } from './prescription.validation.js';

const prescriptionRouter = Router();

prescriptionRouter.use(authenticateAccessToken);

prescriptionRouter.post(
  '/',
  authorizeRoles('admin', 'doctor'),
  validateBody(prescriptionValidation.create),
  prescriptionController.create
);

prescriptionRouter.get(
  '/',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateQuery(prescriptionValidation.list),
  prescriptionController.list
);

prescriptionRouter.patch(
  '/:prescriptionId/adherence',
  authorizeRoles('patient'),
  validateBody(prescriptionValidation.recordAdherence),
  prescriptionController.recordAdherence
);

prescriptionRouter.get(
  '/:prescriptionId/pdf',
  authorizeRoles('patient', 'doctor'),
  prescriptionController.downloadPDF
);

export { prescriptionRouter };
