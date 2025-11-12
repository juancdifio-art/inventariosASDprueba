import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  listCampos,
  getCampoById,
  getCamposPorAplicacion,
  createCampo,
  updateCampo,
  deleteCampo,
  validarValorCampo,
  listTemplates,
  getTemplateById,
  getTemplateByCodigo,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  aplicarTemplate,
} from '../controllers/configuracionCampos.controller.js';

const router = Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', listCampos);
router.get('/aplicacion/:aplica_a', getCamposPorAplicacion);
router.get('/:id', getCampoById);

router.post('/', createCampo);
router.put('/:id', updateCampo);
router.delete('/:id', deleteCampo);
router.post('/:id/validar', validarValorCampo);

router.get('/templates/all', listTemplates);
router.get('/templates/:id', getTemplateById);
router.get('/templates/codigo/:codigo', getTemplateByCodigo);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.post('/templates/:codigo/aplicar', aplicarTemplate);

export default router;
