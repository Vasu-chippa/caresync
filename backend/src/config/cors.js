import cors from 'cors';
import { env } from './env.js';

const configuredOrigins = [env.CORS_ORIGIN, env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: configuredOrigins.length
    ? (requestOrigin, callback) => {
        if (!requestOrigin || configuredOrigins.includes(requestOrigin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
    : true,
  credentials: true,
});
