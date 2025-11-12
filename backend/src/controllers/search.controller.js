import { Op } from 'sequelize';
import { Producto, Proveedor, Categoria } from '../models/index.js';

const MAX_RESULTS_PER_ENTITY = 5;

const sanitizeTerm = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim();
};

const buildLike = (term) => `%${term}%`;

const mapProducto = (producto) => ({
  type: 'producto',
  id: producto.id,
  title: producto.nombre,
  subtitle: producto.codigo,
  description: producto.descripcion,
  route: `/productos/${producto.id}`,
});

const mapProveedor = (proveedor) => ({
  type: 'proveedor',
  id: proveedor.id,
  title: proveedor.nombre,
  subtitle: proveedor.cuit ?? proveedor.email ?? '',
  description: proveedor.contacto ?? proveedor.email_contacto ?? proveedor.direccion,
  route: `/proveedores/${proveedor.id}/editar`,
});

const mapCategoria = (categoria) => ({
  type: 'categoria',
  id: categoria.id,
  title: categoria.nombre,
  subtitle: categoria.descripcion ?? '',
  description: null,
  route: `/categorias/${categoria.id}/editar`,
});

export const globalSearch = async (req, res) => {
  try {
    const term = sanitizeTerm(req.query.q);
    if (!term) {
      return res.json({ success: true, data: { items: [] } });
    }

    const likeValue = buildLike(term);
    const typeFilter = sanitizeTerm(req.query.type);
    const normalizedType = ['producto', 'proveedor', 'categoria'].includes(typeFilter) ? typeFilter : null;

    const [productos, proveedores, categorias] = await Promise.all([
      Producto.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: likeValue } },
            { codigo: { [Op.iLike]: likeValue } },
            { descripcion: { [Op.iLike]: likeValue } },
          ],
        },
        order: [['updated_at', 'DESC']],
        limit: MAX_RESULTS_PER_ENTITY,
      }),
      Proveedor.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: likeValue } },
            { cuit: { [Op.iLike]: likeValue } },
            { email: { [Op.iLike]: likeValue } },
            { email_contacto: { [Op.iLike]: likeValue } },
            { contacto: { [Op.iLike]: likeValue } },
          ],
        },
        order: [['updated_at', 'DESC']],
        limit: MAX_RESULTS_PER_ENTITY,
      }),
      Categoria.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: likeValue } },
            { descripcion: { [Op.iLike]: likeValue } },
          ],
        },
        order: [['updated_at', 'DESC']],
        limit: MAX_RESULTS_PER_ENTITY,
      }),
    ]);

    let items = [
      ...productos.map(mapProducto),
      ...proveedores.map(mapProveedor),
      ...categorias.map(mapCategoria),
    ];

    if (normalizedType) {
      items = items.filter((item) => item.type === normalizedType);
    }

    return res.json({ success: true, data: { items } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en búsqueda global',
      error: { type: 'INTERNAL_ERROR', details: error.message },
    });
  }
};
