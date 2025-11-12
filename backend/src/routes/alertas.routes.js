import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  markAsRead,
  resolveAlert,
  getAlertStats,
} from '../controllers/alertas.controller.js';
import { runStockAlerts } from '../controllers/alertas.config.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.post('/run', runStockAlerts);
router.get('/:id', getAlertById);
router.post('/', createAlert);
router.patch('/:id', updateAlert);
router.delete('/:id', deleteAlert);
router.post('/:id/read', markAsRead);
router.post('/:id/resolve', resolveAlert);

export default router;
