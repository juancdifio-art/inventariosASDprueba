import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { summary } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/summary', authenticate, summary);

export default router;
