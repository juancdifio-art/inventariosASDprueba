export const initialCategoriaForm = {
  nombre: '',
  descripcion: '',
  padre_id: '',
  activo: true,
};

const toStringOrEmpty = (value) => (value === null || value === undefined ? '' : String(value));

export const mapCategoriaToForm = (categoria) => {
  if (!categoria) return { ...initialCategoriaForm };
  return {
    nombre: toStringOrEmpty(categoria.nombre),
    descripcion: toStringOrEmpty(categoria.descripcion),
    padre_id: categoria.padre_id ? String(categoria.padre_id) : '',
    activo: typeof categoria.activo === 'boolean' ? categoria.activo : true,
  };
};

const normalizeStringOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

export const buildCategoriaPayload = (formState) => ({
  nombre: formState.nombre?.trim() || '',
  descripcion: normalizeStringOrNull(formState.descripcion),
  padre_id: formState.padre_id ? Number(formState.padre_id) : null,
  activo: Boolean(formState.activo),
});

export const validateCategoriaForm = (formState) => {
  const errors = [];
  if (!formState.nombre || !formState.nombre.trim()) {
    errors.push('El nombre es obligatorio');
  }
  return errors;
};
