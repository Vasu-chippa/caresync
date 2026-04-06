import { env } from './env.js';

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '').trim();

const configuredOrigins = [env.CORS_ORIGIN, env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter((origin) => !origin.includes('yourdomain.netlify.app'))
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);

  if (configuredOrigins.includes(normalized)) {
    return true;
  }

  // Allow Netlify domains for this deployment flow.
  if (normalized.endsWith('.netlify.app')) {
    return true;
  }

  // Allow localhost during development.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)) {
    return true;
  }

  return configuredOrigins.length === 0;
};

export const corsMiddleware = (req, res, next) => {
  const requestOrigin = req.headers.origin;

  if (isAllowedOrigin(requestOrigin)) {
    if (requestOrigin) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
};
