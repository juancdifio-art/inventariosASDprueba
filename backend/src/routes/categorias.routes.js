import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getAll, getById, create, update, remove, getTree } from '../controllers/categorias.controller.js';

const router = Router();

router.get('/', authenticate, getAll);
router.get('/arbol', authenticate, getTree);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

export default router;
