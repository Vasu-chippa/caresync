import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { validateQuery } from '../../middleware/validateQuery.middleware.js';
import { billingController } from './billing.controller.js';
import { billingValidation } from './billing.validation.js';

const billingRouter = Router();

billingRouter.use(authenticateAccessToken);

billingRouter.post(
  '/invoices',
  authorizeRoles('admin', 'doctor'),
  validateBody(billingValidation.createInvoice),
  billingController.createInvoice
);

billingRouter.get(
  '/invoices',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateQuery(billingValidation.listInvoices),
  billingController.listInvoices
);

billingRouter.patch(
  '/invoices/pay',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateBody(billingValidation.markPaid),
  billingController.markPaid
);

export { billingRouter };
