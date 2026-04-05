import { ApiError } from '../utils/ApiError.js';

export const validateBody = (schema) => (req, _res, next) => {
  const { value, error } = schema.validate(req.body, {
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

  req.body = value;
  return next();
};
