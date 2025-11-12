import { useState } from 'react';
import Button from '../ui/Button.jsx';

const DEFAULT_FORM = {
  id: undefined,
  producto_id: '',
  aplica_todos: false,
  stock_minimo_threshold: '',
  stock_critico_threshold: '',
  dias_sin_movimiento: '',
  frecuencia_minutos: '',
  destinatarios: '',
  activo: true,
};

export default function AlertConfigForm({ productos, onSubmit, onCancel, initialValues = DEFAULT_FORM, isSubmitting }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialValues });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === 'aplica_todos') {
      setForm((prev) => ({
        ...prev,
        aplica_todos: checked,
        producto_id: checked ? '' : prev.producto_id,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className="row g-3">
      <div className="col-12">
        <div className="form-check form-switch mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="alert-config-aplica-todos"
            name="aplica_todos"
            checked={form.aplica_todos}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="alert-config-aplica-todos">
            Aplicar a todos los productos
          </label>
        </div>
        <label className="form-label small text-secondary">Producto</label>
        <select
          className="form-select"
          name="producto_id"
          value={form.producto_id}
          onChange={handleChange}
          required={!form.aplica_todos}
          disabled={form.aplica_todos}
        >
          <option value="">Seleccionar producto</option>
          {productos.map((producto) => (
            <option key={producto.id} value={producto.id}>
              {producto.nombre} (#{producto.codigo})
            </option>
          ))}
        </select>
        <small className="text-secondary">
          Si activas &quot;Aplicar a todos&quot;, esta configuración se usará como predeterminada para los productos sin regla específica.
        </small>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label small text-secondary">Stock mínimo</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="form-control"
          name="stock_minimo_threshold"
          value={form.stock_minimo_threshold}
          onChange={handleChange}
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label small text-secondary">Stock crítico</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="form-control"
          name="stock_critico_threshold"
          value={form.stock_critico_threshold}
          onChange={handleChange}
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label small text-secondary">Días sin movimiento</label>
        <input
          type="number"
          min="0"
          className="form-control"
          name="dias_sin_movimiento"
          value={form.dias_sin_movimiento}
          onChange={handleChange}
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label small text-secondary">Frecuencia (minutos)</label>
        <input
          type="number"
          min="0"
          className="form-control"
          name="frecuencia_minutos"
          value={form.frecuencia_minutos}
          onChange={handleChange}
        />
        <small className="text-secondary">Si se deja vacío, se ejecuta en cada ciclo.</small>
      </div>

      <div className="col-12">
        <label className="form-label small text-secondary">Destinatarios (emails separados por coma)</label>
        <input
          type="text"
          className="form-control"
          name="destinatarios"
          value={form.destinatarios}
          onChange={handleChange}
        />
      </div>

      <div className="col-12">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="alert-config-activo"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="alert-config-activo">
            Configuración activa
          </label>
        </div>
      </div>

      <div className="col-12 d-flex gap-2 justify-content-end">
        <Button type="button" variant="outline-secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
