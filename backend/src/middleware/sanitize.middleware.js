const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/[<>]/g, '').trim();
};

const sanitizeDeep = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = sanitizeDeep(nestedValue);
      return acc;
    }, {});
  }

  return sanitizeString(value);
};

export const sanitizeInputMiddleware = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizedBody = sanitizeDeep(req.body);
    Object.assign(req.body, sanitizedBody);
  }

  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeDeep(req.query);
    Object.assign(req.query, sanitizedQuery);
  }

  next();
};
