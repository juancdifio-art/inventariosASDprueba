import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import ProveedorForm from '../components/proveedores/ProveedorForm.jsx';
import {
  initialProveedorForm,
  validateProveedorForm,
  buildProveedorPayload,
} from '../components/proveedores/formUtils.js';
import { useCreateProveedor } from '../hooks/useProveedores.js';

export default function ProveedorCreate() {
  const navigate = useNavigate();
  const createProveedor = useCreateProveedor();
  const [form, setForm] = useState(initialProveedorForm);
  const [errorMsg, setErrorMsg] = useState('');

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
      await createProveedor.mutateAsync(payload);
      navigate('/proveedores', {
        replace: true,
        state: { success: 'Proveedor creado correctamente' },
      });
    } catch (mutationError) {
      const message = mutationError?.response?.data?.message || mutationError?.message || 'Error al crear proveedor';
      setErrorMsg(message);
    }
  };

  const handleCancel = () => {
    navigate('/proveedores');
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Nuevo proveedor</h3>
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
        <ProveedorForm
          form={form}
          saving={createProveedor.isPending}
          submitLabel="Crear proveedor"
          checkboxId="proveedor-activo-create"
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
