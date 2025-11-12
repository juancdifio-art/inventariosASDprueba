import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';

const paises = [
  { value: '', label: 'Seleccionar país' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'BR', label: 'Brasil' },
  { value: 'PY', label: 'Paraguay' },
];

const condicionesPago = [
  { value: '', label: 'Seleccionar condición' },
  { value: 'contado', label: 'Contado' },
  { value: '7_dias', label: 'A 7 días' },
  { value: '15_dias', label: 'A 15 días' },
  { value: '30_dias', label: 'A 30 días' },
  { value: '45_dias', label: 'A 45 días' },
  { value: '60_dias', label: 'A 60 días' },
];

const ratingOpciones = [
  { value: '', label: 'Sin evaluar' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
];

export default function ProveedorForm({
  form,
  saving = false,
  submitLabel = 'Guardar proveedor',
  checkboxId = 'proveedor-activo',
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form onSubmit={onSubmit} className="proveedor-form">
      <div className="row g-3">
        <Section title="Datos principales" subtitle="Identificación y contacto básico" icon="bi-person-badge">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormControl label="Nombre *" helper="Razón social o nombre comercial">
                <Input name="nombre" value={form.nombre} onChange={onChange} required placeholder="Ej: Proveedor SRL" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="CUIT / Identificador fiscal">
                <Input name="cuit" value={form.cuit} onChange={onChange} placeholder="Ej: 30-12345678-9" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Email">
                <Input name="email" type="email" value={form.email} onChange={onChange} placeholder="contacto@proveedor.com" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Teléfono">
                <Input name="telefono" value={form.telefono} onChange={onChange} placeholder="Ej: 11-5555-5555" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Celular / WhatsApp">
                <Input name="celular" value={form.celular} onChange={onChange} placeholder="Ej: +54 9 11 5555 5555" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Sitio web">
                <Input name="sitio_web" value={form.sitio_web} onChange={onChange} placeholder="www.proveedor.com" />
              </FormControl>
            </div>
          </div>
        </Section>

        <Section title="Ubicación" subtitle="Dónde opera el proveedor" icon="bi-geo-alt">
          <div className="row g-3">
            <div className="col-12">
              <FormControl label="Dirección">
                <Input name="direccion" value={form.direccion} onChange={onChange} placeholder="Calle y número" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Ciudad">
                <Input name="ciudad" value={form.ciudad} onChange={onChange} placeholder="Ciudad" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Provincia">
                <Input name="provincia" value={form.provincia} onChange={onChange} placeholder="Provincia" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="País">
                <Select name="pais" value={form.pais} onChange={onChange} options={paises} />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Código postal">
                <Input name="codigo_postal" value={form.codigo_postal} onChange={onChange} placeholder="CP" />
              </FormControl>
            </div>
          </div>
        </Section>

        <Section title="Contacto comercial" subtitle="Personas de referencia" icon="bi-people">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <FormControl label="Nombre contacto">
                <Input name="contacto" value={form.contacto} onChange={onChange} placeholder="Persona de contacto" />
              </FormControl>
            </div>
            <div className="col-12 col-md-4">
              <FormControl label="Cargo">
                <Input name="cargo_contacto" value={form.cargo_contacto} onChange={onChange} placeholder="Cargo" />
              </FormControl>
            </div>
            <div className="col-12 col-md-4">
              <FormControl label="Email contacto">
                <Input name="email_contacto" type="email" value={form.email_contacto} onChange={onChange} placeholder="contacto@empresa.com" />
              </FormControl>
            </div>
          </div>
        </Section>

        <Section title="Logística" subtitle="Transporte y distribución" icon="bi-truck">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormControl label="Transporte frecuente" helper="Tipo de envío más habitual">
                <Input name="logistica" value={form.logistica} onChange={onChange} placeholder="Ej: Transporte Pérez" />
              </FormControl>
            </div>
            <div className="col-12 col-md-6">
              <FormControl label="Teléfono transporte">
                <Input name="logistica_contacto" value={form.logistica_contacto} onChange={onChange} placeholder="Ej: 11-5555-0000" />
              </FormControl>
            </div>
          </div>
        </Section>

        <Section title="Condiciones comerciales" subtitle="Información para compras" icon="bi-briefcase">
          <div className="row g-3">
            <div className="col-12 col-lg-4">
              <FormControl label="Condición de pago">
                <Select name="condicion_pago" value={form.condicion_pago} onChange={onChange} options={condicionesPago} />
              </FormControl>
            </div>
            <div className="col-12 col-lg-4">
              <FormControl label="Días de entrega" helper="Promedio en días">
                <Input name="dias_entrega" type="number" min="0" value={form.dias_entrega} onChange={onChange} placeholder="Ej: 7" />
              </FormControl>
            </div>
            <div className="col-12 col-lg-4">
              <FormControl label="Monto mínimo">
                <Input name="monto_minimo" type="number" min="0" step="0.01" value={form.monto_minimo} onChange={onChange} placeholder="Ej: 15000" />
              </FormControl>
            </div>
            <div className="col-12 col-lg-4">
              <FormControl label="Rubro / Categoría">
                <Input name="rubro" value={form.rubro} onChange={onChange} placeholder="Segmento" />
              </FormControl>
            </div>
            <div className="col-12 col-lg-4">
              <FormControl label="Rating interno">
                <Select name="rating" value={form.rating} onChange={onChange} options={ratingOpciones} />
              </FormControl>
            </div>
          </div>
        </Section>

        <Section title="Notas y estado" subtitle="Detalles internos" icon="bi-journal-text">
          <div className="row g-3">
            <div className="col-12">
              <FormControl label="Notas internas">
                <textarea
                  className="form-control"
                  name="notas"
                  value={form.notas}
                  onChange={onChange}
                  rows={3}
                  placeholder="Observaciones, acuerdos especiales, etc."
                />
              </FormControl>
            </div>
            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={checkboxId}
                  name="activo"
                  checked={!!form.activo}
                  onChange={onChange}
                />
                <label className="form-check-label" htmlFor={checkboxId}>
                  Proveedor activo
                </label>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        {onCancel && (
          <Button type="button" variant="outline-secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : (
            <>
              <i className="bi bi-check2 me-1" /> {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, subtitle, icon, children }) {
  return (
    <div className="proveedor-form__section p-3 border rounded-3 bg-body-secondary-subtle">
      <div className="d-flex align-items-start gap-2 mb-3">
        <div className="rounded-circle bg-body-secondary text-secondary-emphasis d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
          <i className={`${icon} fs-6`} />
        </div>
        <div>
          <h6 className="mb-1">{title}</h6>
          {subtitle ? <small className="text-secondary">{subtitle}</small> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function FormControl({ label, helper, children }) {
  return (
    <div>
      <label className="form-label mb-1">{label}</label>
      {children}
      {helper ? <div className="form-text">{helper}</div> : null}
    </div>
  );
}
