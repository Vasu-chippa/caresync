import cors from 'cors';
import { env } from './env.js';

const normalizeOrigin = (origin) => origin.replace(/\/$/, '').trim();

const configuredOrigins = [env.CORS_ORIGIN, env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter((origin) => !origin.includes('yourdomain.netlify.app'))
  .filter(Boolean);

const allowsNetlifyOrigin =
  configuredOrigins.length === 0 || configuredOrigins.some((origin) => origin.endsWith('.netlify.app'));

export const corsMiddleware = cors({
  origin: configuredOrigins.length
    ? (requestOrigin, callback) => {
        if (!requestOrigin) {
          return callback(null, true);
        }

        const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
        const isAllowedNetlifyOrigin = allowsNetlifyOrigin && normalizedRequestOrigin.endsWith('.netlify.app');

        if (configuredOrigins.includes(normalizedRequestOrigin) || isAllowedNetlifyOrigin) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
    : true,
  credentials: true,
});
