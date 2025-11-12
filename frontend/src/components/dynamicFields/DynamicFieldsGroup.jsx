import DynamicFieldRenderer from './DynamicFieldRenderer.jsx';

const COLUMN_CLASS = {
  1: 'col-12',
  2: 'col-12 col-md-6',
  3: 'col-12 col-md-4',
  4: 'col-12 col-md-3',
};

const resolveColumnClass = (columns) => COLUMN_CLASS[columns] ?? COLUMN_CLASS[2];

export default function DynamicFieldsGroup({
  title,
  description,
  icon,
  campos = [],
  values = {},
  errors = {},
  onChange,
  columns = 2,
  readOnly = false,
  className = '',
  renderExtra,
  emptyMessage = 'Sin campos configurados',
}) {
  const colClass = resolveColumnClass(columns);

  if (!campos.length) {
    return emptyMessage ? (
      <div className={`dynamic-fields-group empty ${className}`.trim()}>
        {title ? <h6 className="mb-2 text-uppercase text-secondary">{title}</h6> : null}
        <div className="text-secondary fst-italic small">{emptyMessage}</div>
      </div>
    ) : null;
  }

  return (
    <section className={`dynamic-fields-group border rounded-3 bg-body-secondary-subtle p-3 ${className}`.trim()}>
      {(title || description) && (
        <header className="d-flex align-items-start gap-2 mb-3">
          {icon ? (
            <div className="rounded-circle bg-body-secondary text-secondary-emphasis d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
              <i className={`${icon} fs-6`} />
            </div>
          ) : null}
          <div>
            {title ? <h6 className="mb-1">{title}</h6> : null}
            {description ? <small className="text-secondary">{description}</small> : null}
          </div>
        </header>
      )}

      <div className="row g-3">
        {campos.map((campo) => {
          const nombre = campo?.nombre;
          const fieldValue = nombre ? values?.[nombre] : undefined;
          const fieldError = nombre ? errors?.[nombre] : undefined;

          return (
            <div key={nombre ?? campo?.id ?? Math.random()} className={colClass}>
              <DynamicFieldRenderer
                campo={campo}
                value={fieldValue}
                error={fieldError}
                disabled={readOnly || campo?.soloLectura}
                renderExtra={renderExtra}
                onChange={(nextValue, currentCampo, event) => {
                  if (typeof onChange === 'function' && currentCampo?.nombre) {
                    onChange(currentCampo.nombre, nextValue, currentCampo, event);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
