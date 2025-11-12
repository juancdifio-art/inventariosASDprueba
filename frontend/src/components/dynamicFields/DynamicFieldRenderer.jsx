import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';

const normalizeOptions = (opciones = []) => {
  if (!Array.isArray(opciones)) return [];
  return opciones
    .map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      if (!opt || typeof opt !== 'object') return null;
      const value = opt.value ?? opt.codigo ?? opt.id;
      const label = opt.label ?? opt.nombre ?? value;
      if (!value || !label) return null;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean);
};

export default function DynamicFieldRenderer({
  campo,
  value,
  onChange,
  error,
  disabled = false,
  renderExtra,
  name,
}) {
  if (!campo) return null;

  const {
    tipo,
    etiqueta,
    ayuda,
    placeholder,
    obligatorio,
    opciones,
    icono,
  } = campo;

  const fieldName = name ?? campo.nombre;
  const normalizedOptions = normalizeOptions(opciones);
  const commonProps = {
    id: fieldName,
    name: fieldName,
    className: error ? 'is-invalid' : '',
    disabled,
    required: obligatorio,
    placeholder: placeholder ?? undefined,
    value: value ?? '',
    onChange: (event) => {
      const target = event.target;
      let nextValue = target.value;
      if (tipo === 'numero') {
        nextValue = target.value === '' ? '' : Number.parseInt(target.value, 10);
        if (Number.isNaN(nextValue)) nextValue = '';
      } else if (tipo === 'decimal') {
        const parsed = Number(target.value);
        nextValue = Number.isNaN(parsed) ? '' : parsed;
      } else if (tipo === 'boolean') {
        nextValue = target.checked;
      } else if (tipo === 'multi_select') {
        nextValue = Array.from(target.selectedOptions).map((opt) => opt.value);
      }
      onChange?.(nextValue, campo, event);
    },
  };

  const renderHelper = () => {
    if (error) return <div className="invalid-feedback d-block">{error}</div>;
    if (ayuda) return <div className="form-text">{ayuda}</div>;
    return null;
  };

  const wrapField = (control) => (
    <div className="mb-3">
      <label className="form-label" htmlFor={fieldName}>
        {icono ? <i className={`${icono} me-1`} /> : null}
        {etiqueta}
        {obligatorio ? <span className="text-danger ms-1">*</span> : null}
      </label>
      {control}
      {renderHelper()}
      {typeof renderExtra === 'function' ? renderExtra(campo, value) : null}
    </div>
  );

  switch (tipo) {
    case 'numero':
      return wrapField(<Input type="number" {...commonProps} />);
    case 'decimal':
      return wrapField(<Input type="number" step="0.01" {...commonProps} />);
    case 'fecha':
      return wrapField(<Input type="date" {...commonProps} />);
    case 'boolean':
      return (
        <div className="form-check form-switch mb-3">
          <input
            type="checkbox"
            className={`form-check-input ${error ? 'is-invalid' : ''}`.trim()}
            id={fieldName}
            name={fieldName}
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(event) => {
              onChange?.(event.target.checked, campo, event);
            }}
          />
          <label className="form-check-label" htmlFor={fieldName}>
            {icono ? <i className={`${icono} me-1`} /> : null}
            {etiqueta}
            {obligatorio ? <span className="text-danger ms-1">*</span> : null}
          </label>
          {renderHelper()}
          {typeof renderExtra === 'function' ? renderExtra(campo, value) : null}
        </div>
      );
    case 'select':
      return wrapField(
        <Select {...commonProps}>
          <option value="">Seleccionar...</option>
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>,
      );
    case 'multi_select':
      return wrapField(
        <select
          {...commonProps}
          multiple
          value={Array.isArray(value) ? value : []}
          className={`form-select ${error ? 'is-invalid' : ''}`.trim()}
        >
          {normalizedOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>,
      );
    case 'email':
      return wrapField(<Input type="email" {...commonProps} />);
    case 'telefono':
      return wrapField(<Input type="tel" {...commonProps} />);
    case 'url':
      return wrapField(<Input type="url" {...commonProps} />);
    case 'color':
      return wrapField(
        <div className="d-flex align-items-center gap-2">
          <Input type="color" {...commonProps} className="form-control-color" />
          <Input type="text" value={value ?? ''} onChange={(event) => onChange?.(event.target.value, campo, event)} />
        </div>,
      );
    case 'texto_largo':
      return wrapField(
        <textarea
          {...commonProps}
          className={`form-control ${error ? 'is-invalid' : ''}`.trim()}
          rows={4}
        />,
      );
    case 'texto':
    default:
      return wrapField(<Input type="text" {...commonProps} />);
  }
}
