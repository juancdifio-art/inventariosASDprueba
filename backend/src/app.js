import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import hpp from 'hpp';
import xss from 'xss-clean';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import categoriasRouter from './routes/categorias.routes.js';
import proveedoresRouter from './routes/proveedores.routes.js';
import productosRouter from './routes/productos.routes.js';
import movimientosRouter from './routes/movimientos.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import alertasRouter from './routes/alertas.routes.js';
import configuracionCamposRouter from './routes/configuracionCampos.routes.js';
import searchRouter from './routes/search.routes.js';
import auditoriasRouter from './routes/auditorias.routes.js';
import reportesRouter from './routes/reportes.routes.js';
import importacionesRouter from './routes/importaciones.routes.js';
import { auditoriaMiddleware } from './middleware/audit.middleware.js';
import { securityLogger } from './middleware/securityLogger.middleware.js';
import { sanitizeRequest } from './middleware/sanitize.middleware.js';

const app = express();

const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const whitelistIps = new Set((process.env.RATE_LIMIT_WHITELIST || '').split(',').map((ip) => ip.trim()).filter(Boolean));
const blacklistIps = new Set((process.env.RATE_LIMIT_BLACKLIST || '').split(',').map((ip) => ip.trim()).filter(Boolean));

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip;
};

app.disable('x-powered-by');

app.use((req, res, next) => {
  const clientIp = getClientIp(req);
  if (blacklistIps.has(clientIp)) {
    return res.status(403).json({ success: false, message: 'Acceso bloqueado desde esta IP' });
  }
  req.clientIp = clientIp;
  req.isWhitelisted = whitelistIps.has(clientIp);
  return next();
});

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\''],
      imgSrc: ['\'self\' data:'],
      connectSrc: ['\'self\''],
      upgradeInsecureRequests: [],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
  credentials: true,
}));

app.use(hpp());
app.use(xss());

app.use((req, res, next) => {
  if (isProduction && req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  return next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

if (!isProduction) {
  app.use(morgan('dev'));
}

app.use(sanitizeRequest);
app.use(auditoriaMiddleware);
app.use(securityLogger);

const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === '1' || process.env.DISABLE_RATE_LIMIT === 'true';

if (!isRateLimitDisabled) {
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => Boolean(req.isWhitelisted),
    keyGenerator: (req) => {
      if (req.user?.id) return `user:${req.user.id}`;
      if (req.clientIp) return req.clientIp;
      return req.ip;
    },
    handler: (req, res) => {
      return res.status(429).json({ success: false, message: 'Demasiadas solicitudes, intentalo más tarde.' });
    },
  });
  app.use('/api/', limiter);
}

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/productos', productosRouter);
app.use('/api/movimientos', movimientosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/alertas', alertasRouter);
app.use('/api/configuracion-campos', configuracionCamposRouter);
app.use('/api/search', searchRouter);
app.use('/api/auditorias', auditoriasRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/importaciones', importacionesRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Recurso no encontrado' });
});

export default app;
