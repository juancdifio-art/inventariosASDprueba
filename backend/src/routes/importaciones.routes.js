import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  previewProductosImport,
  confirmProductosImport,
  exportProductosCSV,
  exportProductosExcel,
  downloadProductosTemplateCSV,
  downloadProductosTemplateExcel,
} from '../controllers/importaciones.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const adminOnly = [authenticate, authorize('admin')];

router.post('/productos/preview', adminOnly, upload.single('file'), previewProductosImport);
router.post('/productos/confirm', adminOnly, upload.single('file'), confirmProductosImport);
router.get('/productos/export/csv', adminOnly, exportProductosCSV);
router.get('/productos/export/excel', adminOnly, exportProductosExcel);
router.get('/productos/templates/:codigo/csv', adminOnly, downloadProductosTemplateCSV);
router.get('/productos/templates/:codigo/excel', adminOnly, downloadProductosTemplateExcel);

export default router;
