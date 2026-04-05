import { logger } from '../config/logger.js';
import { metrics } from '../config/metrics.js';

export const requestLoggerMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - start;
    const durationMs = Number(elapsedNs / 1000000n);
    const payload = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    };

    metrics.request(durationMs);
    if (res.statusCode >= 400) {
      metrics.error();
      logger.warn('http_request', payload);
      return;
    }

    logger.info('http_request', payload);
  });

  next();
};
