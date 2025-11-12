import { useEffect, useMemo, useState } from 'react';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Alert from '../components/ui/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import {
  usePreviewProductosImport,
  useConfirmProductosImport,
  useExportProductosCSV,
  useExportProductosExcel,
  useDownloadTemplateProductosCSV,
  useDownloadTemplateProductosExcel,
} from '../hooks/useImportaciones.js';
import { useCategoriasList } from '../hooks/useCategorias.js';
import { useProveedoresList } from '../hooks/useProveedores.js';
import { useCamposPorAplicacion, useTemplatesList } from '../hooks/useConfiguracionCampos.js';

const REQUIRED_FIELDS = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
];

const OPTIONAL_FIELDS = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'categoria_id', label: 'Categoría ID' },
  { key: 'proveedor_id', label: 'Proveedor ID' },
  { key: 'stock_actual', label: 'Stock' },
  { key: 'stock_minimo', label: 'Stock mínimo' },
  { key: 'precio', label: 'Precio' },
  { key: 'activo', label: 'Activo' },
];

const MODE_OPTIONS = [
  { value: 'upsert', label: 'Crear y actualizar (upsert)' },
  { value: 'create_only', label: 'Solo crear (ignorar existentes)' },
  { value: 'update_only', label: 'Solo actualizar existentes' },
];

const EXPORT_ACTIVO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Solo activos' },
  { value: 'false', label: 'Solo inactivos' },
];

const BASE_EXPORT_COLUMNS = [
  { key: 'ID', label: 'ID' },
  { key: 'Codigo', label: 'Código' },
  { key: 'Nombre', label: 'Nombre' },
  { key: 'Descripcion', label: 'Descripción' },
  { key: 'CategoriaId', label: 'Categoría ID' },
  { key: 'ProveedorId', label: 'Proveedor ID' },
  { key: 'StockActual', label: 'Stock actual' },
  { key: 'StockMinimo', label: 'Stock mínimo' },
  { key: 'Precio', label: 'Precio' },
  { key: 'Activo', label: 'Activo' },
  { key: 'CreadoEn', label: 'Creado' },
  { key: 'ActualizadoEn', label: 'Actualizado' },
];

const arraysShallowEqual = (a = [], b = []) => a.length === b.length && a.every((value, index) => value === b[index]);

export default function ImportExportPage() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isAdmin = user?.rol === 'admin';

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [mode, setMode] = useState('upsert');
  const [summary, setSummary] = useState(null);
  const [selectedTemplateCodigo, setSelectedTemplateCodigo] = useState('');
  const [selectedBaseColumns, setSelectedBaseColumns] = useState(BASE_EXPORT_COLUMNS.map((column) => column.key));
  const [selectedDynamicColumns, setSelectedDynamicColumns] = useState([]);
  const [dynamicSelectionTouched, setDynamicSelectionTouched] = useState(false);

  const categoriasQuery = useCategoriasList({ page: 1, limit: 100 });
  const proveedoresQuery = useProveedoresList({ page: 1, limit: 100 });
  const camposListQuery = useCamposPorAplicacion('productos', { agrupados: false }, { staleTime: 5 * 60 * 1000 });
  const templatesListQuery = useTemplatesList({ activo: true }, { staleTime: 5 * 60 * 1000, enabled: isAdmin });

  const categoriasOptions = categoriasQuery.data?.items ?? [];
  const proveedoresOptions = proveedoresQuery.data?.items ?? [];

  const templatesOptions = useMemo(() => {
    if (!templatesListQuery.data) return [];
    if (Array.isArray(templatesListQuery.data)) return templatesListQuery.data;
    if (Array.isArray(templatesListQuery.data.data)) return templatesListQuery.data.data;
    if (Array.isArray(templatesListQuery.data.items)) return templatesListQuery.data.items;
    return [];
  }, [templatesListQuery.data]);

  const selectedTemplate = useMemo(() => (
    templatesOptions.find((template) => template.codigo === selectedTemplateCodigo) ?? null
  ), [selectedTemplateCodigo, templatesOptions]);

  const templateDynamicFields = useMemo(() => (
    (selectedTemplate?.campos_config ?? []).map((campo) => ({
      ...campo,
      label: campo.etiqueta || campo.nombre,
    }))
  ), [selectedTemplate]);

  const dynamicCamposOptions = useMemo(() => {
    const items = Array.isArray(camposListQuery.data) ? [...camposListQuery.data] : [];
    return items
      .sort((a, b) => {
        const grupoA = a.grupo || '';
        const grupoB = b.grupo || '';
        if (grupoA.localeCompare(grupoB) !== 0) {
          return grupoA.localeCompare(grupoB);
        }
        const ordenA = typeof a.orden === 'number' ? a.orden : Number.MAX_SAFE_INTEGER;
        const ordenB = typeof b.orden === 'number' ? b.orden : Number.MAX_SAFE_INTEGER;
        if (ordenA !== ordenB) {
          return ordenA - ordenB;
        }
        return (a.nombre || '').localeCompare(b.nombre || '');
      })
      .map((campo) => ({
        ...campo,
        label: campo.etiqueta || campo.nombre,
      }));
  }, [camposListQuery.data]);

  const remainingDynamicFields = useMemo(() => (
    dynamicCamposOptions.filter((campo) => !templateDynamicFields.some((templateCampo) => templateCampo.nombre === campo.nombre))
  ), [dynamicCamposOptions, templateDynamicFields]);

  const defaultDynamicColumns = useMemo(() => {
    if (!dynamicCamposOptions.length) return [];
    const visibles = dynamicCamposOptions.filter((campo) => campo.visible_en_listado);
    const base = (visibles.length ? visibles : dynamicCamposOptions).map((campo) => campo.nombre);
    return base;
  }, [dynamicCamposOptions]);

  useEffect(() => {
    if (dynamicSelectionTouched) return;
    if (!dynamicCamposOptions.length) {
      if (selectedDynamicColumns.length) {
        setSelectedDynamicColumns([]);
      }
      return;
    }
    if (!arraysShallowEqual(selectedDynamicColumns, defaultDynamicColumns)) {
      setSelectedDynamicColumns(defaultDynamicColumns);
    }
  }, [defaultDynamicColumns, dynamicCamposOptions.length, dynamicSelectionTouched, selectedDynamicColumns]);

  const [exportFilters, setExportFilters] = useState({
    search: '',
    categoria_id: '',
    proveedor_id: '',
    activo: '',
    min_stock: '',
    max_stock: '',
    min_price: '',
    max_price: '',
  });

  const previewMutation = usePreviewProductosImport({
    onSuccess: (data) => {
      setPreviewData(data);
      setMapping(data?.suggestedMapping ?? {});
      setSummary(null);
      if (selectedTemplate) {
        const suggestedMapping = { ...data?.suggestedMapping };
        templateDynamicFields.forEach((campo) => {
          if (!campo?.nombre) return;
          if (!Object.prototype.hasOwnProperty.call(suggestedMapping, campo.nombre)) {
            suggestedMapping[campo.nombre] = data?.headers?.find((header) => header?.toLowerCase() === campo.nombre.toLowerCase()) ?? null;
          }
        });
        setMapping(suggestedMapping);
      }
      addNotification({ type: 'success', message: 'Archivo analizado correctamente.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo procesar el archivo.';
      addNotification({ type: 'error', message });
    },
  });

  const confirmMutation = useConfirmProductosImport({
    onSuccess: (data) => {
      setSummary(data);
      addNotification({ type: 'success', message: 'Importación ejecutada correctamente.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo completar la importación.';
      addNotification({ type: 'error', message });
    },
  });

  const exportCsvMutation = useExportProductosCSV({
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Exportación CSV generada.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo generar el CSV.';
      addNotification({ type: 'error', message });
    },
  });

  const exportExcelMutation = useExportProductosExcel({
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Exportación Excel generada.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo generar el Excel.';
      addNotification({ type: 'error', message });
    },
  });

  const downloadTemplateCsvMutation = useDownloadTemplateProductosCSV({
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Template CSV descargado.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo descargar el CSV.';
      addNotification({ type: 'error', message });
    },
  });

  const downloadTemplateExcelMutation = useDownloadTemplateProductosExcel({
    onSuccess: () => {
      addNotification({ type: 'success', message: 'Template Excel descargado.' });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'No se pudo descargar el Excel.';
      addNotification({ type: 'error', message });
    },
  });

  const headersOptions = useMemo(() => previewData?.headers ?? [], [previewData?.headers]);

  const missingRequired = useMemo(() => {
    if (!mapping) return REQUIRED_FIELDS.map((field) => field.key);
    return REQUIRED_FIELDS.filter((field) => !mapping[field.key])
      .map((field) => field.key);
  }, [mapping]);

  const missingDynamicRequired = useMemo(() => {
    const requiredDynamicFields = [...templateDynamicFields, ...remainingDynamicFields].filter((campo) => campo.obligatorio);
    if (!requiredDynamicFields.length) return [];
    return requiredDynamicFields.filter((campo) => {
      const value = mapping?.[campo.nombre];
      return !value;
    });
  }, [mapping, remainingDynamicFields, templateDynamicFields]);

  const previewRows = previewData?.preview ?? [];

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
    setPreviewData(null);
    setSummary(null);
  };

  const handleTemplateChange = (event) => {
    const value = event.target.value;
    setSelectedTemplateCodigo(value);
    if (!value) {
      return;
    }

    const template = templatesOptions.find((item) => item.codigo === value);
    if (!template) return;

    const templateFields = (template.campos_config ?? []).map((campo) => campo.nombre).filter(Boolean);
    if (!templateFields.length) return;

    setMapping((prev) => {
      const next = { ...(previewData?.suggestedMapping ?? prev) };
      templateFields.forEach((nombreCampo) => {
        if (!Object.prototype.hasOwnProperty.call(next, nombreCampo)) {
          next[nombreCampo] = null;
        }
      });
      return next;
    });
  };

  const handleDownloadTemplateCsv = () => {
    if (!selectedTemplateCodigo) {
      addNotification({ type: 'error', message: 'Seleccioná un template para descargar.' });
      return;
    }
    downloadTemplateCsvMutation.mutate(selectedTemplateCodigo);
  };

  const handleDownloadTemplateExcel = () => {
    if (!selectedTemplateCodigo) {
      addNotification({ type: 'error', message: 'Seleccioná un template para descargar.' });
      return;
    }
    downloadTemplateExcelMutation.mutate(selectedTemplateCodigo);
  };

  const handlePreview = (event) => {
    event.preventDefault();
    if (!selectedFile) {
      addNotification({ type: 'error', message: 'Seleccioná un archivo CSV o Excel.' });
      return;
    }
    previewMutation.mutate(selectedFile);
  };

  const handleMappingChange = (field, value) => {
    setMapping((prev) => ({ ...prev, [field]: value || null }));
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !previewData) {
      addNotification({ type: 'error', message: 'Primero cargá un archivo y obtené la vista previa.' });
      return;
    }
    if (missingRequired.length) {
      addNotification({ type: 'error', message: 'Asigná columnas para los campos obligatorios.' });
      return;
    }
    if (missingDynamicRequired.length) {
      const nombres = missingDynamicRequired.map((campo) => campo.label || campo.nombre).join(', ');
      addNotification({ type: 'error', message: `Asigná columnas para: ${nombres}.` });
      return;
    }
    await confirmMutation.mutateAsync({ file: selectedFile, mapping, mode });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setMapping({});
    setSummary(null);
    setMode('upsert');
  };

  const handleExportFilterChange = (event) => {
    const { name, value } = event.target;
    setExportFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleBaseColumnToggle = (key) => {
    setSelectedBaseColumns((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const handleDynamicColumnToggle = (key) => {
    setDynamicSelectionTouched(true);
    setSelectedDynamicColumns((prev) => {
      const exists = prev.includes(key);
      return exists ? prev.filter((item) => item !== key) : [...prev, key];
    });
  };

  const handleSelectAllDynamic = () => {
    setDynamicSelectionTouched(true);
    setSelectedDynamicColumns(dynamicCamposOptions.map((campo) => campo.nombre));
  };

  const handleClearDynamic = () => {
    setDynamicSelectionTouched(true);
    setSelectedDynamicColumns([]);
  };

  const buildExportPayload = () => ({
    ...exportFilters,
    columns: selectedBaseColumns,
    dynamicColumns: selectedDynamicColumns,
  });

  const handleExportCsv = () => {
    exportCsvMutation.mutate(buildExportPayload());
  };

  const handleExportExcel = () => {
    exportExcelMutation.mutate(buildExportPayload());
  };

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h3 className="mb-1">Importación y Exportación</h3>
            <p className="text-secondary mb-0">Solo los administradores pueden acceder a esta sección.</p>
          </div>
          <Breadcrumbs />
        </div>
        <Alert variant="warning" className="mt-3">
          No tenés permisos para gestionar importaciones y exportaciones de productos.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Importación y Exportación</h3>
          <p className="text-secondary mb-0">Subí productos desde CSV/Excel y exportá listados filtrados.</p>
        </div>
        <Breadcrumbs />
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Importar productos</h5>
                <small className="text-secondary">Formato soportado: CSV, TSV, XLSX (hasta 10 MB).</small>
              </div>
              <div>
                <Button type="button" variant="outline-secondary" size="sm" onClick={handleReset} disabled={!selectedFile}>
                  <i className="bi bi-arrow-counterclockwise" /> Reiniciar
                </Button>
              </div>
            </div>

            <form className="mb-3" onSubmit={handlePreview}>
              <div className="mb-3">
                <label className="form-label">Archivo</label>
                <input className="form-control" type="file" accept=".csv,.tsv,.txt,.xlsx,.xlsm,.xlsb" onChange={handleFileChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Template de importación (opcional)</label>
                <div className="d-flex flex-column flex-md-row gap-2">
                  <Select value={selectedTemplateCodigo} onChange={handleTemplateChange}>
                    <option value="">Sin template</option>
                    {templatesOptions.map((template) => (
                      <option key={template.codigo} value={template.codigo}>
                        {template.nombre}
                      </option>
                    ))}
                  </Select>
                  <div className="d-flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      disabled={!selectedTemplateCodigo || downloadTemplateCsvMutation.isLoading}
                      onClick={handleDownloadTemplateCsv}
                    >
                      {downloadTemplateCsvMutation.isLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : (
                        <>
                          <i className="bi bi-filetype-csv" /> CSV
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      disabled={!selectedTemplateCodigo || downloadTemplateExcelMutation.isLoading}
                      onClick={handleDownloadTemplateExcel}
                    >
                      {downloadTemplateExcelMutation.isLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-excel" /> Excel
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {selectedTemplate ? (
                  <small className="text-secondary d-block mt-1">
                    {selectedTemplate.descripcion || 'El template incluye campos predeterminados para facilitar el mapeo.'}
                  </small>
                ) : (
                  <small className="text-secondary d-block mt-1">Podés descargar un archivo base con los campos requeridos según industria.</small>
                )}
              </div>
              <Button type="submit" variant="primary" isLoading={previewMutation.isLoading} disabled={!selectedFile}>
                <i className="bi bi-search" /> Analizar archivo
              </Button>
            </form>

            {previewData ? (
              <div className="mt-3">
                <h6 className="mb-2">Mapeo de columnas</h6>
                {missingRequired.length ? (
                  <Alert variant="warning" className="mb-3">
                    Asigná columnas para: {missingRequired.map((field) => REQUIRED_FIELDS.find((f) => f.key === field)?.label ?? field).join(', ')}.
                  </Alert>
                ) : null}
                {!missingRequired.length && missingDynamicRequired.length ? (
                  <Alert variant="warning" className="mb-3">
                    Campos dinámicos obligatorios pendientes: {missingDynamicRequired.map((campo) => campo.label || campo.nombre).join(', ')}.
                  </Alert>
                ) : null}

                <div className="row g-3">
                  {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
                    <div key={field.key} className="col-12 col-md-6">
                      <label className="form-label">
                        {field.label}
                        {REQUIRED_FIELDS.some((req) => req.key === field.key) ? ' *' : ''}
                      </label>
                      <Select value={mapping[field.key] ?? ''} onChange={(event) => handleMappingChange(field.key, event.target.value)}>
                        <option value="">No asignar</option>
                        {headersOptions.map((header) => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>

                {templateDynamicFields.length ? (
                  <div className="mt-4">
                    <h6 className="mb-2">Campos del template</h6>
                    <div className="row g-3">
                      {templateDynamicFields.map((campo) => (
                        <div key={campo.nombre} className="col-12 col-md-6">
                          <label className="form-label">
                            {campo.label}
                            {campo.obligatorio ? ' *' : ''}
                          </label>
                          <Select value={mapping[campo.nombre] ?? ''} onChange={(event) => handleMappingChange(campo.nombre, event.target.value)}>
                            <option value="">No asignar</option>
                            {headersOptions.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {remainingDynamicFields.length ? (
                  <div className="mt-4">
                    <h6 className="mb-2">Otros campos dinámicos</h6>
                    <div className="row g-3">
                      {remainingDynamicFields.map((campo) => (
                        <div key={campo.nombre} className="col-12 col-md-6">
                          <label className="form-label">
                            {campo.label}
                            {campo.obligatorio ? ' *' : ''}
                          </label>
                          <Select value={mapping[campo.nombre] ?? ''} onChange={(event) => handleMappingChange(campo.nombre, event.target.value)}>
                            <option value="">No asignar</option>
                            {headersOptions.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-4">
                  <h6 className="mb-2">Vista previa (primeras {previewRows.length} filas)</h6>
                  <div className="table-responsive border rounded">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Descripción</th>
                          <th>Stock</th>
                          <th>Precio</th>
                          <th>Errores</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.length ? previewRows.map((row) => (
                          <tr key={row.index} className={row.errors?.length ? 'table-warning' : ''}>
                            <td>{row.index}</td>
                            <td>{row.values?.codigo ?? '-'}</td>
                            <td>{row.values?.nombre ?? '-'}</td>
                            <td>{row.values?.descripcion ?? '-'}</td>
                            <td>{row.values?.stock_actual ?? '-'}</td>
                            <td>{row.values?.precio ?? '-'}</td>
                            <td>{row.errors?.length ? row.errors.join(', ') : '-'}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={7} className="text-center text-secondary py-3">Sin registros para vista previa.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <small className="text-secondary d-block mt-2">
                    La vista previa utiliza el mapeo sugerido al momento del análisis. Si cambiás el mapeo, asegurate de revisarlo antes de confirmar.
                  </small>
                </div>

                <div className="mt-4">
                  <h6 className="mb-2">Modo de importación</h6>
                  <div className="d-flex flex-column gap-2">
                    {MODE_OPTIONS.map((option) => (
                      <div key={option.value} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="import-mode"
                          id={`mode-${option.value}`}
                          value={option.value}
                          checked={mode === option.value}
                          onChange={(event) => setMode(event.target.value)}
                        />
                        <label className="form-check-label" htmlFor={`mode-${option.value}`}>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 d-flex gap-2">
                  <Button type="button" variant="primary" onClick={handleConfirmImport} isLoading={confirmMutation.isLoading}>
                    <i className="bi bi-cloud-arrow-up" /> Confirmar importación
                  </Button>
                  <Button type="button" variant="outline-secondary" onClick={handleReset}>
                    Cancelar
                  </Button>
                </div>

                {summary ? (
                  <div className="mt-3">
                    <Alert variant="success">
                      <div className="fw-semibold mb-2">Resumen</div>
                      <ul className="mb-0">
                        <li>Total filas procesadas: {summary.total}</li>
                        <li>Creados: {summary.created}</li>
                        <li>Actualizados: {summary.updated}</li>
                        <li>Omitidos: {summary.skipped}</li>
                      </ul>
                      {summary.errors?.length ? (
                        <div className="mt-2">
                          <div className="fw-semibold">Errores:</div>
                          <ul className="mb-0 small">
                            {summary.errors.slice(0, 10).map((error, index) => (
                              <li key={`${error.index}-${index}`}>
                                Fila {error.index} ({error.codigo || 'sin código'}): {error.errors.join(', ')}
                              </li>
                            ))}
                            {summary.errors.length > 10 ? (
                              <li>... {summary.errors.length - 10} errores adicionales.</li>
                            ) : null}
                          </ul>
                        </div>
                      ) : null}
                    </Alert>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card p-3">
            <h5 className="mb-3">Exportar productos</h5>
            <p className="text-secondary small mb-3">
              Generá un listado de productos aplicando filtros. Los exports se realizan en el momento.
            </p>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Búsqueda</label>
                <Input
                  name="search"
                  placeholder="Nombre, código o descripción"
                  value={exportFilters.search}
                  onChange={handleExportFilterChange}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Categoría</label>
                <Select name="categoria_id" value={exportFilters.categoria_id} onChange={handleExportFilterChange}>
                  <option value="">Todas</option>
                  {categoriasOptions.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                  ))}
                </Select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Proveedor</label>
                <Select name="proveedor_id" value={exportFilters.proveedor_id} onChange={handleExportFilterChange}>
                  <option value="">Todos</option>
                  {proveedoresOptions.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                  ))}
                </Select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Estado</label>
                <Select name="activo" value={exportFilters.activo} onChange={handleExportFilterChange}>
                  {EXPORT_ACTIVO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>

              <div className="col-6 col-md-3">
                <label className="form-label">Stock desde</label>
                <Input name="min_stock" type="number" min="0" value={exportFilters.min_stock} onChange={handleExportFilterChange} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Stock hasta</label>
                <Input name="max_stock" type="number" min="0" value={exportFilters.max_stock} onChange={handleExportFilterChange} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Precio desde</label>
                <Input name="min_price" type="number" min="0" step="0.01" value={exportFilters.min_price} onChange={handleExportFilterChange} />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label">Precio hasta</label>
                <Input name="max_price" type="number" min="0" step="0.01" value={exportFilters.max_price} onChange={handleExportFilterChange} />
              </div>

              <div className="col-12">
                <label className="form-label">Columnas base</label>
                <div className="row g-2">
                  {BASE_EXPORT_COLUMNS.map((column) => (
                    <div className="col-12 col-sm-6" key={column.key}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`base-column-${column.key}`}
                          checked={selectedBaseColumns.includes(column.key)}
                          onChange={() => handleBaseColumnToggle(column.key)}
                        />
                        <label className="form-check-label" htmlFor={`base-column-${column.key}`}>
                          {column.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <small className="text-secondary d-block mt-1">Seleccioná las columnas estándar que querés incluir.</small>
              </div>

              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label mb-0">Campos dinámicos</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-link btn-sm px-1"
                      onClick={handleSelectAllDynamic}
                      disabled={!dynamicCamposOptions.length}
                    >
                      Seleccionar todos
                    </button>
                    <button
                      type="button"
                      className="btn btn-link btn-sm px-1"
                      onClick={handleClearDynamic}
                      disabled={!selectedDynamicColumns.length}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                {camposListQuery.isLoading ? (
                  <div className="text-secondary small">Cargando campos dinámicos...</div>
                ) : camposListQuery.isError ? (
                  <div className="text-danger small">No se pudieron obtener los campos dinámicos.</div>
                ) : dynamicCamposOptions.length ? (
                  <div className="row g-2 mt-1">
                    {dynamicCamposOptions.map((campo) => (
                      <div className="col-12 col-sm-6" key={campo.nombre}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`dynamic-column-${campo.nombre}`}
                            checked={selectedDynamicColumns.includes(campo.nombre)}
                            onChange={() => handleDynamicColumnToggle(campo.nombre)}
                          />
                          <label className="form-check-label" htmlFor={`dynamic-column-${campo.nombre}`}>
                            {campo.label}
                            {campo.grupo ? <span className="text-secondary ms-1">({campo.grupo})</span> : null}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary small">No hay campos dinámicos activos.</div>
                )}
              </div>
            </div>

            <div className="d-flex flex-column gap-2 mt-4">
              <Button type="button" variant="outline-primary" onClick={handleExportCsv} isLoading={exportCsvMutation.isLoading}>
                <i className="bi bi-download" /> Exportar CSV
              </Button>
              <Button type="button" variant="primary" onClick={handleExportExcel} isLoading={exportExcelMutation.isLoading}>
                <i className="bi bi-file-earmark-excel" /> Exportar Excel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
