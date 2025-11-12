import { useMemo, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Table from '../components/base/Table.jsx';
import Alert from '../components/ui/Alert.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import DynamicFieldRenderer from '../components/dynamicFields/DynamicFieldRenderer.jsx';
import DynamicFieldsSection from '../components/dynamicFields/DynamicFieldsSection.jsx';
import {
  TIPOS_CAMPO,
  APLICACIONES,
} from '../services/configuracionCamposService.js';
import {
  useConfiguracionCamposList,
  useCreateConfiguracionCampo,
  useUpdateConfiguracionCampo,
  useDeleteConfiguracionCampo,
  useTemplatesList,
  useAplicarTemplate,
} from '../hooks/useConfiguracionCampos.js';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EMPTY_CAMPO = {
  nombre: '',
  etiqueta: '',
  tipo: 'texto',
  aplica_a: 'productos',
  grupo: '',
  orden: 0,
  placeholder: '',
  ayuda: '',
  icono: '',
  obligatorio: false,
  visible_en_listado: false,
  visible_en_detalle: true,
  activo: true,
  opciones: [],
  validaciones: {},
};

const columnasTabla = [
  { key: 'nombre', label: 'Nombre', accessor: 'nombre' },
  { key: 'etiqueta', label: 'Etiqueta', accessor: 'etiqueta' },
  { key: 'tipo', label: 'Tipo', accessor: 'tipo' },
  { key: 'aplica_a', label: 'Aplica a', accessor: 'aplica_a' },
  { key: 'grupo', label: 'Grupo', accessor: (row) => row.grupo ?? '-' },
  { key: 'orden', label: 'Orden', accessor: (row) => row.orden ?? '-' },
  {
    key: 'activo',
    label: 'Activo',
    render: (row) => (
      <span className={`badge ${row.activo ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
        {row.activo ? 'Sí' : 'No'}
      </span>
    ),
  },
];

export default function ConfiguracionCamposPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [aplicaFiltro, setAplicaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [selectedCampo, setSelectedCampo] = useState(null);
  const [modo, setModo] = useState('list');
  const [formCampo, setFormCampo] = useState(EMPTY_CAMPO);
  const [errors, setErrors] = useState({});
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [templateCodigo, setTemplateCodigo] = useState('');

  const queryParams = useMemo(() => ({
    page,
    limit,
    search: search || undefined,
    aplica_a: aplicaFiltro || undefined,
    tipo: tipoFiltro || undefined,
    grupo: grupoFiltro || undefined,
    activo: estadoFiltro || undefined,
    sort_by: 'orden',
    sort_dir: 'asc',
  }), [page, limit, search, aplicaFiltro, tipoFiltro, grupoFiltro, estadoFiltro]);

  const camposList = useConfiguracionCamposList(queryParams, { enabled: isAdmin });
  const templatesList = useTemplatesList({ activo: true }, { enabled: isAdmin });
  const createCampo = useCreateConfiguracionCampo();
  const updateCampo = useUpdateConfiguracionCampo();
  const deleteCampo = useDeleteConfiguracionCampo();
  const aplicarTemplate = useAplicarTemplate();
  const { addNotification } = useNotifications();

  const resetForm = () => {
    setFormCampo(EMPTY_CAMPO);
    setErrors({});
    setModo('list');
    setSelectedCampo(null);
  };

  const handleEdit = (campo) => {
    setSelectedCampo(campo);
    setFormCampo({ ...EMPTY_CAMPO, ...campo, opciones: campo.opciones ?? [], validaciones: campo.validaciones ?? {} });
    setModo('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = () => {
    setSelectedCampo(null);
    setFormCampo(EMPTY_CAMPO);
    setModo('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setErrors({});
    try {
      if (modo === 'create') {
        await createCampo.mutateAsync(formCampo);
        addNotification('Campo creado correctamente', { type: 'success' });
      } else if (modo === 'edit' && selectedCampo?.id) {
        await updateCampo.mutateAsync({ id: selectedCampo.id, payload: formCampo });
        addNotification('Campo actualizado correctamente', { type: 'success' });
      }
      resetForm();
      camposList.invalidate();
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const nextErrors = {};
        validationErrors.forEach((message) => {
          if (message?.includes(':')) {
            const [field, detail] = message.split(':');
            nextErrors[field.trim()] = detail.trim();
          }
        });
        setErrors(nextErrors);
      }
      const message = err?.response?.data?.message || 'No se pudo guardar el campo';
      addNotification(message, { type: 'error' });
    }
  };

  const handleDelete = (campo) => {
    setDeleteTarget(campo);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteCampo.mutateAsync(deleteTarget.id);
      addNotification('Campo eliminado correctamente', { type: 'success' });
      setShowDelete(false);
      setDeleteTarget(null);
      camposList.invalidate();
    } catch (err) {
      const message = err?.response?.data?.message || 'No se pudo eliminar el campo';
      addNotification(message, { type: 'error' });
    }
  };

  const handleApplyTemplate = async () => {
    if (!templateCodigo) return;
    try {
      await aplicarTemplate.mutateAsync(templateCodigo);
      setTemplateCodigo('');
      addNotification('Template aplicado correctamente', { type: 'success' });
      camposList.invalidate();
    } catch (err) {
      const message = err?.response?.data?.message || 'No se pudo aplicar el template';
      addNotification(message, { type: 'error' });
    }
  };

  const templatesData = useMemo(() => {
    if (!templatesList.data) return [];
    if (Array.isArray(templatesList.data)) return templatesList.data;
    if (Array.isArray(templatesList.data.items)) return templatesList.data.items;
    return [];
  }, [templatesList.data]);

  const templatesOptions = useMemo(() => (
    templatesData.map((template) => ({ value: template.codigo, label: template.nombre }))
  ), [templatesData]);

  const selectedTemplate = useMemo(() => (
    templatesData.find((template) => template.codigo === templateCodigo) ?? null
  ), [templatesData, templateCodigo]);

  const renderActions = (campo) => (
    <div className="d-flex gap-2">
      <Button type="button" size="sm" variant="outline-primary" onClick={() => handleEdit(campo)}>
        <i className="bi bi-pencil" /> Editar
      </Button>
      <Button type="button" size="sm" variant="outline-danger" onClick={() => handleDelete(campo)}>
        <i className="bi bi-trash" /> Eliminar
      </Button>
    </div>
  );

  const TooltipLabel = ({ label, tooltip }) => (
    <span className="d-inline-flex align-items-center gap-1">
      <span>{label}</span>
      <span className="text-muted" role="img" aria-label={`Información sobre ${label}`} title={tooltip}>
        <i className="bi bi-info-circle" />
      </span>
    </span>
  );

  const renderForm = () => (
    <form onSubmit={handleSave} className="card p-3 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">{modo === 'create' ? 'Nuevo campo' : 'Editar campo'}</h5>
          <small className="text-secondary">Definí cómo se mostrará y validará este campo dinámico.</small>
        </div>
        <div className="d-flex gap-2">
          <Button type="button" variant="outline-secondary" onClick={resetForm}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={createCampo.isLoading || updateCampo.isLoading}>
            {(createCampo.isLoading || updateCampo.isLoading) ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              <>
                <i className="bi bi-check2" /> Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label">Nombre interno *</label>
          <Input
            value={formCampo.nombre}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, nombre: event.target.value }))}
            placeholder="ej: fecha_vencimiento"
            required
          />
          {errors.nombre ? <div className="invalid-feedback d-block">{errors.nombre}</div> : null}
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Etiqueta *</label>
          <Input
            value={formCampo.etiqueta}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, etiqueta: event.target.value }))}
            placeholder="ej: Fecha de vencimiento"
            required
          />
          {errors.etiqueta ? <div className="invalid-feedback d-block">{errors.etiqueta}</div> : null}
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Tipo *</label>
          <Select
            value={formCampo.tipo}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, tipo: event.target.value }))}
            required
          >
            {TIPOS_CAMPO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Aplica a *</label>
          <Select
            value={formCampo.aplica_a}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, aplica_a: event.target.value }))}
            required
          >
            {APLICACIONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Grupo</label>
          <Input
            value={formCampo.grupo}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, grupo: event.target.value }))}
            placeholder="ej: Información técnica"
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Orden</label>
          <Input
            type="number"
            value={formCampo.orden}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, orden: Number(event.target.value) }))}
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Placeholder</label>
          <Input
            value={formCampo.placeholder}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, placeholder: event.target.value }))}
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label">Icono</label>
          <Input
            value={formCampo.icono}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, icono: event.target.value }))}
            placeholder="ej: bi-thermometer"
          />
        </div>
        <div className="col-12">
          <label className="form-label">Ayuda</label>
          <textarea
            className="form-control"
            value={formCampo.ayuda}
            onChange={(event) => setFormCampo((prev) => ({ ...prev, ayuda: event.target.value }))}
            rows={2}
          />
        </div>
      </div>

      <div className="row g-3 mt-3">
        <div className="col-12 col-md-6">
          <label className="form-label">
            <TooltipLabel
              label="Visible en listado"
              tooltip="Muestra este campo como una columna adicional en el listado principal de la entidad."
            />
          </label>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formCampo.visible_en_listado}
              onChange={(event) => setFormCampo((prev) => ({ ...prev, visible_en_listado: event.target.checked }))}
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">
            <TooltipLabel
              label="Visible en detalle"
              tooltip="Incluye el campo dentro de la ficha de detalle y vistas de lectura del registro."
            />
          </label>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formCampo.visible_en_detalle}
              onChange={(event) => setFormCampo((prev) => ({ ...prev, visible_en_detalle: event.target.checked }))}
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">
            <TooltipLabel
              label="Obligatorio"
              tooltip="Exige que el campo sea completado al crear o editar registros cuando esté activo."
            />
          </label>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formCampo.obligatorio}
              onChange={(event) => setFormCampo((prev) => ({ ...prev, obligatorio: event.target.checked }))}
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">
            <TooltipLabel
              label="Activo"
              tooltip="Cuando está desactivado el campo deja de mostrarse y no se solicita en formularios, pero se conserva su historial."
            />
          </label>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formCampo.activo}
              onChange={(event) => setFormCampo((prev) => ({ ...prev, activo: event.target.checked }))}
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h6>Vista previa</h6>
        <DynamicFieldRenderer
          campo={{
            ...formCampo,
            nombre: 'vista_previa',
            etiqueta: formCampo.etiqueta || 'Vista previa',
            ayuda: formCampo.ayuda,
            placeholder: formCampo.placeholder,
            opciones: formCampo.opciones,
          }}
          value={formCampo.valor_default ?? (formCampo.tipo === 'multi_select' ? [] : '')}
          onChange={(value) => setFormCampo((prev) => ({ ...prev, valor_default: value }))}
          error={errors.valor_default}
          disabled
        />
      </div>

      <div className="row g-3 mt-3">
        <div className="col-12 col-lg-6">
          <label className="form-label">Opciones (para selects)</label>
          <textarea
            className="form-control"
            rows={4}
            value={JSON.stringify(formCampo.opciones ?? [], null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value);
                if (Array.isArray(parsed)) {
                  setErrors((prev) => ({ ...prev, opciones: undefined }));
                  setFormCampo((prev) => ({ ...prev, opciones: parsed }));
                } else {
                  setErrors((prev) => ({ ...prev, opciones: 'Debe ser un arreglo válido' }));
                }
              } catch {
                setErrors((prev) => ({ ...prev, opciones: 'JSON inválido' }));
              }
            }}
          />
          {errors.opciones ? <div className="invalid-feedback d-block">{errors.opciones}</div> : null}
          <small className="text-secondary">{'Formato: ["valor"] o [ {"value": "codigo", "label": "Texto"} ]'}</small>
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label">Validaciones</label>
          <textarea
            className="form-control"
            rows={4}
            value={JSON.stringify(formCampo.validaciones ?? {}, null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  setErrors((prev) => ({ ...prev, validaciones: undefined }));
                  setFormCampo((prev) => ({ ...prev, validaciones: parsed }));
                } else {
                  setErrors((prev) => ({ ...prev, validaciones: 'Debe ser un objeto válido' }));
                }
              } catch {
                setErrors((prev) => ({ ...prev, validaciones: 'JSON inválido' }));
              }
            }}
          />
          {errors.validaciones ? <div className="invalid-feedback d-block">{errors.validaciones}</div> : null}
          <small className="text-secondary">Keys soportadas: min, max, minLength, maxLength, pattern.</small>
        </div>
      </div>
    </form>
  );

  const renderFilters = () => (
    <div className="card p-3 mb-3">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4">
          <label className="form-label">Buscar</label>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o etiqueta" />
        </div>
        <div className="col-12 col-md-2">
          <label className="form-label">Tipo</label>
          <Select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)}>
            <option value="">Todos</option>
            {TIPOS_CAMPO.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-12 col-md-2">
          <label className="form-label">Aplicación</label>
          <Select value={aplicaFiltro} onChange={(event) => setAplicaFiltro(event.target.value)}>
            <option value="">Todas</option>
            {APLICACIONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-12 col-md-2">
          <label className="form-label">Grupo</label>
          <Input value={grupoFiltro} onChange={(event) => setGrupoFiltro(event.target.value)} placeholder="ej: técnicos" />
        </div>
        <div className="col-12 col-md-2">
          <label className="form-label">Estado</label>
          <Select value={estadoFiltro} onChange={(event) => setEstadoFiltro(event.target.value)}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderTable = () => {
    const items = camposList.data?.items ?? [];
    const total = camposList.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const isLoading = camposList.isLoading;
    const isFetching = camposList.isFetching;
    const hasItems = items.length > 0;

    const rangeStart = hasItems ? (page - 1) * limit + 1 : 0;
    const rangeEnd = hasItems ? Math.min(rangeStart + limit - 1, total) : 0;
    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
      <div className="card p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 className="mb-1">Campos configurados</h5>
            <small className="text-secondary">Total: {total}</small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Select value={templateCodigo} onChange={(event) => setTemplateCodigo(event.target.value)}>
              <option value="">Seleccionar template...</option>
              {templatesOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="button" variant="outline-primary" disabled={!templateCodigo || aplicarTemplate.isLoading} onClick={handleApplyTemplate}>
              {aplicarTemplate.isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                <>
                  <i className="bi bi-lightning" /> Aplicar template
                </>
              )}
            </Button>
            <Button type="button" variant="primary" onClick={handleCreate}>
              <i className="bi bi-plus-circle" /> Nuevo campo
            </Button>
          </div>
        </div>

        {selectedTemplate ? (
          <div className="alert alert-info d-flex flex-column gap-2" role="status">
            <div>
              <strong>{selectedTemplate.nombre}</strong>
              {selectedTemplate.industria ? <span className="text-secondary"> · Industria: {selectedTemplate.industria}</span> : null}
            </div>
            {selectedTemplate.descripcion ? (
              <div className="small text-secondary">{selectedTemplate.descripcion}</div>
            ) : null}
            <div className="small">
              Campos incluidos ({selectedTemplate.campos_config?.length ?? 0}):
              <ul className="mb-0 ps-3">
                {(selectedTemplate.campos_config ?? []).map((campo) => (
                  <li key={campo.nombre}>
                    <strong>{campo.etiqueta}</strong>
                    <span className="text-secondary"> ({campo.tipo}){campo.obligatorio ? ' · obligatorio' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="text-center py-5 text-secondary">Cargando campos...</div>
        ) : !hasItems ? (
          <div className="text-center py-5 text-secondary">No hay campos configurados</div>
        ) : (
          <div className="table-responsive">
            <Table
              columns={[...columnasTabla, { key: 'actions', label: 'Acciones', render: renderActions }]}
              data={items}
            />
          </div>
        )}

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
          <div className="text-secondary small">
            {isFetching ? 'Actualizando…' : hasItems ? `Mostrando ${rangeStart}–${rangeEnd} de ${total} • Página ${page} / ${totalPages}` : 'Sin resultados'}
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ width: 160 }}>
              <span className="input-group-text">Límite</span>
              <select
                className="form-select"
                value={limit}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
              >
                {[5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="btn-group btn-group-sm" role="group" aria-label="Paginación campos">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setPage(1)} disabled={!canPrev}>
                «
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={!canPrev}>
                ‹
              </button>
              <span className="btn btn-outline-secondary disabled">{page}</span>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={!canNext}>
                ›
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setPage(totalPages)} disabled={!canNext}>
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const dynamicGroups = useMemo(() => {
    const grouped = {};
    const items = camposList.data?.items ?? [];
    items.forEach((campo) => {
      const key = campo.grupo || 'Sin grupo';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(campo);
    });

    return Object.entries(grouped).map(([key, fields]) => ({
      title: key,
      campos: fields,
      columns: 2,
    }));
  }, [camposList.data]);

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h3 className="mb-1">Configuración de Campos</h3>
            <p className="text-secondary mb-0">Gestioná los campos dinámicos y aplicá templates por industria.</p>
          </div>
          <Breadcrumbs />
        </div>
        <Alert variant="warning" className="mt-3">
          Solo los administradores pueden acceder a la configuración de campos dinámicos.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h3 className="mb-1">Configuración de Campos</h3>
          <p className="text-secondary mb-0">Gestioná los campos dinámicos y aplicá templates por industria.</p>
        </div>
        <Breadcrumbs />
      </div>

      {modo !== 'list' ? renderForm() : null}
      {renderFilters()}
      {renderTable()}

      <div className="mt-4">
        <h5 className="mb-2">Vista previa agrupada</h5>
        <DynamicFieldsSection groups={dynamicGroups} values={{}} errors={{}} readOnly className="mb-4" />
      </div>

      <ConfirmModal
        show={showDelete}
        title="Eliminar campo"
        message={`¿Seguro que querés eliminar el campo "${deleteTarget?.etiqueta ?? deleteTarget?.nombre}"?`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDelete(false)}
        disabled={deleteCampo.isLoading}
      />
    </div>
  );
}
