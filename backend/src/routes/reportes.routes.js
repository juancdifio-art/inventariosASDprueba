import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  inventoryReport,
  movementReport,
  stockAlertReport,
  valueReport,
  analyticsReport,
  exportReportToExcel,
} from '../controllers/reportes.controller.js';

const router = Router();

router.use(authenticate, authorize('admin', 'gerente'));

router.get('/inventario', inventoryReport);
router.get('/movimientos', movementReport);
router.get('/alertas', stockAlertReport);
router.get('/valorizacion', valueReport);
router.get('/analytics', analyticsReport);
router.get('/export/:tipo', exportReportToExcel);

export default router;
