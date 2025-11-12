import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import CategoriaForm from '../components/categorias/CategoriaForm.jsx';
import {
  initialCategoriaForm,
  mapCategoriaToForm,
  validateCategoriaForm,
  buildCategoriaPayload,
} from '../components/categorias/formUtils.js';
import { useCategoria, useCategoriasTree, useUpdateCategoria } from '../hooks/useCategorias.js';

export default function CategoriaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: categoria, isLoading, isError } = useCategoria(id);
  const { data: treeData } = useCategoriasTree();
  const updateCategoria = useUpdateCategoria();

  const [form, setForm] = useState(initialCategoriaForm);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (categoria) {
      setForm(mapCategoriaToForm(categoria));
    }
  }, [categoria]);

  const padreOptions = useMemo(() => {
    if (!treeData) return [];
    const flatten = (nodes, depth = 0) => nodes.flatMap((node) => {
      if (String(node.id) === String(id)) return flatten(node.hijos || [], depth + 1);
      const prefix = depth > 0 ? `${'› '.repeat(depth)}` : '';
      return [
        { value: String(node.id), label: `${prefix}${node.nombre}`.trim() },
        ...flatten(node.hijos || [], depth + 1),
      ];
    });
    return flatten(treeData, 0);
  }, [treeData, id]);

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
      await updateCategoria.mutateAsync({ id, payload });
      navigate('/categorias', {
        replace: true,
        state: { success: 'Categoría actualizada correctamente' },
      });
    } catch (mutationError) {
      const message = mutationError?.response?.data?.message || mutationError?.message || 'Error al actualizar categoría';
      setErrorMsg(message);
    }
  };

  const handleCancel = () => {
    navigate('/categorias');
  };

  const isSaving = updateCategoria.isPending;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Editar categoría</h3>
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
        {isError ? (
          <Alert variant="danger" className="py-2">
            No se pudo cargar la categoría
          </Alert>
        ) : (
          <CategoriaForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            saving={isSaving || isLoading}
            submitLabel="Actualizar categoría"
            onCancel={handleCancel}
            padreOptions={padreOptions}
            checkboxId="categoria-activo-edit"
          />
        )}
      </div>
    </div>
  );
}
