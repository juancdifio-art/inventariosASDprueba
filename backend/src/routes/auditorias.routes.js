import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  listAuditorias,
  getAuditoriaById,
  getHistorialByRegistro,
  getAuditoriaStats,
} from '../controllers/auditorias.controller.js';

const router = Router();

router.use(authenticate, authorize('admin', 'gerente'));

router.get('/', listAuditorias);
router.get('/stats', getAuditoriaStats);
router.get('/:id', getAuditoriaById);
router.get('/:tabla/:registroId/historial', getHistorialByRegistro);

export default router;
