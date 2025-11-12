import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';

export default function CategoriaForm({
  form,
  onChange,
  onSubmit,
  saving = false,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  padreOptions = [],
  checkboxId = 'categoria-activo',
}) {
  return (
    <form className="row g-3" onSubmit={onSubmit}>
      <div className="col-12">
        <label className="form-label">Nombre</label>
        <Input name="nombre" value={form.nombre} onChange={onChange} required />
      </div>
      <div className="col-12">
        <label className="form-label">Descripción</label>
        <textarea className="form-control" name="descripcion" value={form.descripcion} onChange={onChange} rows={3} />
      </div>
      <div className="col-12">
        <label className="form-label">Categoría padre</label>
        <Select name="padre_id" value={form.padre_id} onChange={onChange}>
          <option value="">Sin padre</option>
          {padreOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>
      <div className="col-12">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id={checkboxId} name="activo" checked={form.activo} onChange={onChange} />
          <label className="form-check-label" htmlFor={checkboxId}>Activo</label>
        </div>
      </div>
      <div className="col-12 d-flex justify-content-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline-secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
