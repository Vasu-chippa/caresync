import { ApiError } from '../utils/ApiError.js';

export const authorizeRoles = (...roles) => {
  const allowedRoles = new Set(roles);

  return (req, _res, next) => {
    if (!req.auth?.role) {
      return next(new ApiError('Authentication required', 401));
    }

    if (!allowedRoles.has(req.auth.role)) {
      return next(new ApiError('Forbidden: insufficient permissions', 403));
    }

    return next();
  };
};
