import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { doctorController } from './doctor.controller.js';
import { doctorValidation } from './doctor.validation.js';

const doctorRouter = Router();

doctorRouter.get('/', authenticateAccessToken, authorizeRoles('admin', 'doctor', 'patient'), doctorController.list);
doctorRouter.get('/me', authenticateAccessToken, authorizeRoles('doctor'), doctorController.me);
doctorRouter.patch(
	'/me',
	authenticateAccessToken,
	authorizeRoles('doctor'),
	validateBody(doctorValidation.updateProfile),
	doctorController.updateMe
);

export { doctorRouter };
