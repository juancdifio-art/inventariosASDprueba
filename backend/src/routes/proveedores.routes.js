import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getAll, search, getById, create, update, remove } from '../controllers/proveedores.controller.js';

const router = Router();

router.get('/', authenticate, getAll);
router.get('/search', authenticate, search);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

export default router;
