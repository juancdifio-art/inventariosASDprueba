import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  recordMovement,
  bulkMovements,
  getMovements,
  getByProduct,
  getMovementById,
  getMovementsSummary,
  exportMovementsCSV,
  exportMovementsExcel,
} from '../controllers/movimientos.controller.js';

const router = Router();

router.get('/', authenticate, getMovements);
router.get('/producto/:id', authenticate, getByProduct);
router.get('/summary', authenticate, getMovementsSummary);
router.get('/export/csv', authenticate, exportMovementsCSV);
router.get('/export/excel', authenticate, exportMovementsExcel);
router.get('/:id', authenticate, getMovementById);
router.post('/', authenticate, recordMovement);
router.post('/bulk', authenticate, bulkMovements);

export default router;
