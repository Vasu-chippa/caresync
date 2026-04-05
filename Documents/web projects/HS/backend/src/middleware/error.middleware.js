import { ApiResponse } from '../utils/ApiResponse.js';
import { logger } from '../config/logger.js';

export const errorMiddleware = (error, req, res, next) => {
  logger.error(error.message, {
    requestId: req.requestId,
    path: req.originalUrl,
    stack: error.stack,
  });

  const statusCode = error.statusCode || 500;

  return ApiResponse.error(
    res,
    error.message || 'Internal server error',
    statusCode,
    process.env.NODE_ENV === 'production' ? null : error.details || error.stack
  );
};
