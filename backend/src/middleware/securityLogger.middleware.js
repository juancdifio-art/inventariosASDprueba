import logger from '../utils/logger.js';

const SENSITIVE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const securityLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if ([401, 403, 429].includes(res.statusCode)) {
      logger.warn('security.event', {
        status: res.statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.clientIp || req.ip,
        userId: req.user?.id ?? null,
        duration,
        userAgent: req.headers['user-agent'] || null,
        message: res.locals?.securityMessage || res.locals?.message || undefined,
      });
    } else if (SENSITIVE_METHODS.has(req.method) && res.statusCode >= 500) {
      logger.error('security.exception', {
        status: res.statusCode,
        method: req.method,
        url: req.originalUrl,
        ip: req.clientIp || req.ip,
        userId: req.user?.id ?? null,
        duration,
        userAgent: req.headers['user-agent'] || null,
      });
    }
  });

  next();
};
