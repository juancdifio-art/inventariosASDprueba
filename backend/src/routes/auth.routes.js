import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.clientIp ?? req.ip,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Demasiados intentos de login. Intentá nuevamente más tarde.' }),
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, me);

export default router;
