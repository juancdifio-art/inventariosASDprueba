import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Alert from '../components/ui/Alert.jsx';
import ProductoForm from '../components/productos/ProductoForm.jsx';
import { createProducto } from '../services/productoService.js';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useCamposPorAplicacion } from '../hooks/useConfiguracionCampos.js';
import { applyCampoDefaults, buildAtributosPayload, flattenCampoGroups, hasNumericCampos, normalizeCampoGroups, validateCamposValues } from '../utils/dynamicFields.js';

export default function ProductCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: '',
    proveedor_id: '',
    stock_actual: 0,
    stock_minimo: 0,
    precio: 0,
    activo: true,
  });
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [campoErrors, setCampoErrors] = useState({});

  const camposQuery = useCamposPorAplicacion('productos', { agrupados: true }, { staleTime: 5 * 60 * 1000 });
  const campoGroups = useMemo(() => normalizeCampoGroups(camposQuery.data), [camposQuery.data]);
  const camposPlanos = useMemo(() => flattenCampoGroups(campoGroups), [campoGroups]);
  const requiereDecimal = useMemo(() => hasNumericCampos(camposPlanos), [camposPlanos]);

  useEffect(() => {
    if (!camposQuery.isSuccess) return;
    setForm((prev) => applyCampoDefaults(campoGroups, prev));
  }, [camposQuery.isSuccess, campoGroups]);

  useEffect(() => {
    async function load() {
      try {
        const [cats, provs] = await Promise.all([
          api.get('/categorias', { params: { page: 1, limit: 1000 } }),
          api.get('/proveedores', { params: { page: 1, limit: 1000 } }),
        ]);
        setCategorias(cats.data.data.items || []);
        setProveedores(provs.data.data.items || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Error al cargar catálogos');
        addNotification({ variant: 'danger', message: e?.response?.data?.message || 'Error al cargar catálogos de productos' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCampoChange = (nombre, valor) => {
    setForm((prev) => ({ ...prev, [nombre]: valor }));
    setCampoErrors((prev) => ({ ...prev, [nombre]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');
    setCampoErrors({});

    try {
      const fieldErrors = validateCamposValues(camposPlanos, form);
      if (Object.keys(fieldErrors).length) {
        setCampoErrors(fieldErrors);
        setSaving(false);
        return;
      }

      const payload = {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
        stock_actual: requiereDecimal ? Number(form.stock_actual) || 0 : Number.parseInt(form.stock_actual, 10) || 0,
        stock_minimo: requiereDecimal ? Number(form.stock_minimo) || 0 : Number.parseInt(form.stock_minimo, 10) || 0,
        precio: Number(form.precio) || 0,
        activo: !!form.activo,
        atributos_personalizados: buildAtributosPayload(camposPlanos, form),
      };

      const created = await createProducto(payload);
      setMsg('Producto creado correctamente');
      addNotification({ variant: 'success', message: 'Producto creado correctamente' });
      await queryClient.invalidateQueries({ queryKey: ['productos'] });
      setTimeout(() => navigate(`/productos/${created.id}`), 800);
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al crear producto');
      addNotification({ variant: 'danger', message: e?.response?.data?.message || 'Error al crear producto' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Nuevo producto</h3>
        <div className="d-flex gap-2">
          <Link to="/productos" className="btn btn-outline-secondary btn-sm">Volver</Link>
        </div>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        {msg && <Alert variant="success" className="py-2">{msg}</Alert>}
        {loading || camposQuery.isLoading ? (
          <LoadingSpinner label="Cargando catálogos..." />
        ) : (
          <ProductoForm
            form={form}
            onChange={onChange}
            categorias={categorias}
            proveedores={proveedores}
            onSubmit={handleSubmit}
            saving={saving}
            submitLabel="Crear producto"
            onCancel={() => navigate('/productos')}
            checkboxId="producto-activo-create"
            camposDinamicos={campoGroups}
            camposErrores={campoErrors}
            onCampoChange={handleCampoChange}
            camposLoading={camposQuery.isFetching && !camposQuery.isSuccess}
          />
        )}
      </div>
    </div>
  );
}
