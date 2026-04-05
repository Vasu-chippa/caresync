import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { ratingController } from './rating.controller.js';

const router = Router();

// Create a rating (patient only)
router.post('/', authenticateAccessToken, authorizeRoles('patient'), ratingController.create);

// Update a rating (patient only, own ratings)
router.patch('/:ratingId', authenticateAccessToken, authorizeRoles('patient'), ratingController.update);

// Delete a rating (patient only, own ratings)
router.delete('/:ratingId', authenticateAccessToken, authorizeRoles('patient'), ratingController.delete);

// Get ratings for a doctor
router.get('/doctor/:doctorId', ratingController.getByDoctor);

// Get doctor stats
router.get('/doctor/:doctorId/stats', ratingController.getStats);

export default router;
