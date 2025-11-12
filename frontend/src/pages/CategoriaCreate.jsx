import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import CategoriaForm from '../components/categorias/CategoriaForm.jsx';
import {
  initialCategoriaForm,
  validateCategoriaForm,
  buildCategoriaPayload,
} from '../components/categorias/formUtils.js';
import { useCreateCategoria, useCategoriasTree } from '../hooks/useCategorias.js';

export default function CategoriaCreate() {
  const navigate = useNavigate();
  const createCategoria = useCreateCategoria();
  const { data: treeData, isLoading: treeLoading } = useCategoriasTree();
  const [form, setForm] = useState(initialCategoriaForm);
  const [errorMsg, setErrorMsg] = useState('');

  const padreOptions = (treeData ?? []).flatMap((node) => flattenTree(node));

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    const validationErrors = validateCategoriaForm(form);
    if (validationErrors.length) {
      setErrorMsg(validationErrors.join(' • '));
      return;
    }

    try {
      const payload = buildCategoriaPayload(form);
      await createCategoria.mutateAsync(payload);
      navigate('/categorias', {
        replace: true,
        state: { success: 'Categoría creada correctamente' },
      });
    } catch (mutationError) {
      const message = mutationError?.response?.data?.message || mutationError?.message || 'Error al crear categoría';
      setErrorMsg(message);
    }
  };

  const handleCancel = () => {
    navigate('/categorias');
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Nueva categoría</h3>
        <Button variant="outline-secondary" size="sm" onClick={handleCancel}>
          <i className="bi bi-arrow-left me-1" /> Volver
        </Button>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        {errorMsg && (
          <Alert variant="danger" className="py-2">
            {errorMsg}
          </Alert>
        )}
        <CategoriaForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          saving={createCategoria.isPending}
          submitLabel="Crear categoría"
          onCancel={handleCancel}
          padreOptions={treeLoading ? [] : padreOptions}
          checkboxId="categoria-activo-create"
        />
      </div>
    </div>
  );
}

function flattenTree(node, depth = 0) {
  const prefix = depth > 0 ? `${'› '.repeat(depth)}` : '';
  const current = [{ value: String(node.id), label: `${prefix}${node.nombre}`.trim() }];
  const children = (node.hijos || []).flatMap((child) => flattenTree(child, depth + 1));
  return [...current, ...children];
}
