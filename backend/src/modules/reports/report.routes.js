import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { Router } from 'express';
import { authenticateAccessToken } from '../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../middleware/role.middleware.js';
import { validateQuery } from '../../middleware/validateQuery.middleware.js';
import { validateBody } from '../../middleware/validate.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import { reportController } from './report.controller.js';
import { reportValidation } from './report.validation.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(path.basename(file.originalname)).toLowerCase();

    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      return cb(new ApiError('Unsupported file type', 400));
    }

    return cb(null, true);
  },
});

const reportRouter = Router();

reportRouter.use(authenticateAccessToken);

reportRouter.post(
  '/upload',
  authorizeRoles('admin', 'doctor', 'patient'),
  upload.single('file'),
  validateBody(reportValidation.uploadBody),
  reportController.upload
);

reportRouter.get(
  '/',
  authorizeRoles('admin', 'doctor', 'patient'),
  validateQuery(reportValidation.list),
  reportController.list
);

reportRouter.get(
  '/:reportId/download',
  authorizeRoles('admin', 'doctor', 'patient'),
  reportController.download
);

export { reportRouter };
