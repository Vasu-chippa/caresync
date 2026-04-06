import express from 'express';
import path from 'path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { corsMiddleware } from './config/cors.js';
import { apiRateLimiter } from './config/rateLimit.js';
import router from './routes/index.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { sanitizeInputMiddleware } from './middleware/sanitize.middleware.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.middleware.js';
import { notFoundMiddleware } from './middleware/notFound.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(sanitizeInputMiddleware);
app.use('/api/v1', apiRateLimiter);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Serve frontend static files in production
const frontendDistPath = path.resolve(process.cwd(), 'frontend', 'dist');
app.use(express.static(frontendDistPath));

app.use('/api/v1', router);

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath);
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
