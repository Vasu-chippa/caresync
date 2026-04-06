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

app.use('/api/v1', router);

app.get('/', (_req, res) => {
	res.status(200).json({
		success: true,
		message: 'CareSyncr backend is running',
		data: {
			docs: '/api/v1/docs',
			health: '/api/v1/health',
		},
	});
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
