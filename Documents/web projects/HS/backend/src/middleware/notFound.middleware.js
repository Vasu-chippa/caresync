import { ApiResponse } from '../utils/ApiResponse.js';

export const notFoundMiddleware = (req, res) => {
  return ApiResponse.error(res, 'Route not found', 404, {
    path: req.originalUrl,
    method: req.method,
  });
};
