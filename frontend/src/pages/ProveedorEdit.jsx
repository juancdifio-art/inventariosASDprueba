import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import ProveedorForm from '../components/proveedores/ProveedorForm.jsx';
import {
  initialProveedorForm,
  mapProveedorToForm,
  validateProveedorForm,
  buildProveedorPayload,
} from '../components/proveedores/formUtils.js';
import { useProveedor, useUpdateProveedor } from '../hooks/useProveedores.js';

export default function ProveedorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: proveedor, isLoading, isError } = useProveedor(id);
  const updateProveedor = useUpdateProveedor();

  const [form, setForm] = useState(initialProveedorForm);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (proveedor) {
      setForm(mapProveedorToForm(proveedor));
    }
  }, [proveedor]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');

    const validationErrors = validateProveedorForm(form);
    if (validationErrors.length) {
      setErrorMsg(validationErrors.join(' • '));
      return;
    }

    try {
      const payload = buildProveedorPayload(form);
      if (!payload.nombre) {
        setErrorMsg('El nombre es obligatorio');
        return;
      }
      await updateProveedor.mutateAsync({ id, payload });
      navigate('/proveedores', {
        replace: true,
        state: { success: 'Proveedor actualizado correctamente' },
      });
    } catch (mutationError) {
      const message = mutationError?.response?.data?.message || mutationError?.message || 'Error al actualizar proveedor';
      setErrorMsg(message);
    }
  };

  const handleCancel = () => {
    navigate('/proveedores');
  };

  const isSaving = updateProveedor.isPending;

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Editar proveedor</h3>
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
            No se pudo cargar el proveedor
          </Alert>
        ) : (
          <ProveedorForm
            form={form}
            saving={isSaving || isLoading}
            submitLabel="Actualizar proveedor"
            checkboxId="proveedor-activo-edit"
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
