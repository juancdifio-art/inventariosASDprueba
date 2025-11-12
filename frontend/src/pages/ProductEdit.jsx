import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/api';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Alert from '../components/ui/Alert.jsx';
import ProductoForm from '../components/productos/ProductoForm.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useCamposPorAplicacion } from '../hooks/useConfiguracionCampos.js';
import { applyCampoDefaults, buildAtributosPayload, flattenCampoGroups, hasNumericCampos, normalizeCampoGroups, validateCamposValues } from '../utils/dynamicFields.js';

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', categoria_id: '', proveedor_id: '', stock_actual: 0, stock_minimo: 0, precio: 0, activo: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [campoErrors, setCampoErrors] = useState({});

  const camposQuery = useCamposPorAplicacion('productos', { agrupados: true }, { staleTime: 5 * 60 * 1000 });
  const campoGroups = useMemo(() => normalizeCampoGroups(camposQuery.data), [camposQuery.data]);
  const camposPlanos = useMemo(() => flattenCampoGroups(campoGroups), [campoGroups]);
  const requiereDecimal = useMemo(() => hasNumericCampos(camposPlanos), [camposPlanos]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [prod, cats, provs] = await Promise.all([
          api.get(`/productos/${id}`),
          api.get('/categorias', { params: { page: 1, limit: 1000 } }),
          api.get('/proveedores', { params: { page: 1, limit: 1000 } }),
        ]);
        const p = prod.data.data;
        setCategorias(cats.data.data.items || []);
        setProveedores(provs.data.data.items || []);
        setForm({
          codigo: p.codigo || '',
          nombre: p.nombre || '',
          descripcion: p.descripcion || '',
          categoria_id: p.categoria_id ? String(p.categoria_id) : '',
          proveedor_id: p.proveedor_id ? String(p.proveedor_id) : '',
          stock_actual: Number(p.stock_actual || 0),
          stock_minimo: Number(p.stock_minimo || 0),
          precio: Number(p.precio || 0),
          activo: !!p.activo,
          ...(p.atributos_personalizados || {}),
        });
      } catch (e) {
        const message = e?.response?.data?.message || 'Error al cargar el producto';
        setError(message);
        addNotification({ variant: 'danger', message });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, addNotification]);

  useEffect(() => {
    if (!camposQuery.isSuccess) return;
    setForm((prev) => applyCampoDefaults(campoGroups, prev));
  }, [camposQuery.isSuccess, campoGroups]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
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

      const atributosPayload = buildAtributosPayload(camposPlanos, form);

      await api.put(`/productos/${id}`, {
        codigo: form.codigo,
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        proveedor_id: form.proveedor_id ? Number(form.proveedor_id) : null,
        stock_actual: requiereDecimal ? Number(form.stock_actual) || 0 : Number.parseInt(form.stock_actual, 10) || 0,
        stock_minimo: requiereDecimal ? Number(form.stock_minimo) || 0 : Number.parseInt(form.stock_minimo, 10) || 0,
        precio: Number(form.precio),
        activo: !!form.activo,
        atributos_personalizados: atributosPayload,
      });
      // Invalidar cache de productos para refrescar el listado
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      setMsg('Producto actualizado');
      addNotification({ variant: 'success', message: 'Producto actualizado correctamente' });
      setTimeout(() => navigate(`/productos/${id}`), 800);
    } catch (e) {
      const message = e?.response?.data?.message || 'Error al guardar';
      setError(message);
      addNotification({ variant: 'danger', message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Editar producto</h3>
        <div className="d-flex gap-2">
          <Link to={`/productos/${id}`} className="btn btn-outline-secondary btn-sm">Volver</Link>
        </div>
      </div>
      <Breadcrumbs />

      <div className="card p-3">
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        {msg && <Alert variant="success" className="py-2">{msg}</Alert>}
        {loading ? (
          <LoadingSpinner label="Cargando..." />
        ) : (
          <ProductoForm
            form={form}
            onChange={onChange}
            categorias={categorias}
            proveedores={proveedores}
            onSubmit={handleSubmit}
            saving={saving}
            submitLabel="Guardar cambios"
            onCancel={() => navigate(`/productos/${id}`)}
            checkboxId="producto-activo-edit"
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
