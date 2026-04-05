import { ApiError } from '../utils/ApiError.js';

export const validateQuery = (schema) => (req, _res, next) => {
  const { value, error } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return next(
      new ApiError('Validation failed', 400, {
        fields: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      })
    );
  }

  req.validatedQuery = value;

  try {
    req.query = value;
  } catch (_error) {
  }

  return next();
};
