import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import DynamicFieldsSection from '../dynamicFields/DynamicFieldsSection.jsx';

export default function ProductoForm({
  form,
  onChange,
  categorias = [],
  proveedores = [],
  onSubmit,
  saving = false,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  includeDescripcion = true,
  checkboxId = 'producto-activo',
  camposDinamicos = [],
  camposErrores = {},
  onCampoChange,
  camposLoading = false,
}) {
  return (
    <form className="row g-3" onSubmit={onSubmit}>
      <div className="col-12 col-md-4">
        <label className="form-label">Código</label>
        <Input name="codigo" value={form.codigo} onChange={onChange} required />
      </div>
      <div className="col-12 col-md-8">
        <label className="form-label">Nombre</label>
        <Input name="nombre" value={form.nombre} onChange={onChange} required />
      </div>

      {includeDescripcion && (
        <div className="col-12">
          <label className="form-label">Descripción</label>
          <textarea className="form-control" name="descripcion" value={form.descripcion} onChange={onChange} />
        </div>
      )}

      <div className="col-6 col-md-3">
        <label className="form-label">Categoría</label>
        <Select name="categoria_id" value={form.categoria_id} onChange={onChange}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.nombre}</option>
          ))}
        </Select>
      </div>

      <div className="col-6 col-md-3">
        <label className="form-label">Proveedor</label>
        <Select name="proveedor_id" value={form.proveedor_id} onChange={onChange}>
          <option value="">Sin proveedor</option>
          {proveedores.map((p) => (
            <option key={p.id} value={String(p.id)}>{p.nombre}</option>
          ))}
        </Select>
      </div>

      <div className="col-6 col-md-3">
        <label className="form-label">Stock</label>
        <Input type="number" name="stock_actual" value={form.stock_actual} onChange={onChange} min="0" />
      </div>

      <div className="col-6 col-md-3">
        <label className="form-label">Stock mínimo</label>
        <Input type="number" name="stock_minimo" value={form.stock_minimo} onChange={onChange} min="0" />
      </div>

      <div className="col-6 col-md-3">
        <label className="form-label">Precio</label>
        <Input type="number" step="0.01" name="precio" value={form.precio} onChange={onChange} min="0" />
      </div>

      {onCampoChange ? (
        <div className="col-12">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-2">Campos adicionales</h5>
            {camposLoading ? (
              <span className="text-secondary small">Actualizando...</span>
            ) : null}
          </div>
          {camposLoading && !camposDinamicos.length ? (
            <div className="p-3 border rounded text-center text-secondary small">Cargando campos dinámicos...</div>
          ) : (
            <DynamicFieldsSection
              groups={camposDinamicos}
              values={form}
              errors={camposErrores}
              onChange={onCampoChange}
              className=""
            />
          )}
        </div>
      ) : null}

      <div className="col-12">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id={checkboxId} name="activo" checked={form.activo} onChange={onChange} />
          <label className="form-check-label" htmlFor={checkboxId}>Activo</label>
        </div>
      </div>

      <div className="col-12 d-flex justify-content-end gap-2">
        <Button type="button" variant="outline-secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" variant="primary" isLoading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
