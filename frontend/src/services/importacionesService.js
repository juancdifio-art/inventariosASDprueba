import api from '../api/api';

const downloadBlob = (data, filename, contentDisposition) => {
  let finalName = filename;
  if (!finalName && contentDisposition) {
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition);
    if (match) {
      finalName = decodeURIComponent(match[1]);
    }
  }
  if (!finalName) {
    finalName = `export_${new Date().toISOString().split('T')[0]}`;
  }

  const blobUrl = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', finalName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const normalizeExportParams = (params = {}) => {
  if (!params) return {};
  const {
    columns,
    dynamic_columns,
    dynamicColumns,
    columns_list,
    baseColumns,
    ...rest
  } = params;

  const normalized = { ...rest };

  const join = (value) => {
    if (Array.isArray(value)) return value.filter((item) => item != null).join(',');
    return value ?? '';
  };

  const hasColumnsParam = Object.prototype.hasOwnProperty.call(params, 'columns')
    || Object.prototype.hasOwnProperty.call(params, 'columns_list')
    || Object.prototype.hasOwnProperty.call(params, 'baseColumns');

  const resolvedColumns = columns ?? columns_list ?? baseColumns;
  if (hasColumnsParam && typeof resolvedColumns !== 'undefined') {
    normalized.columns = join(resolvedColumns);
  } else if (Array.isArray(resolvedColumns) && resolvedColumns.length) {
    normalized.columns = join(resolvedColumns);
  }

  const hasDynamicParam = Object.prototype.hasOwnProperty.call(params, 'dynamic_columns')
    || Object.prototype.hasOwnProperty.call(params, 'dynamicColumns');

  const resolvedDynamic = dynamic_columns ?? dynamicColumns;
  if (hasDynamicParam) {
    normalized.dynamic_columns = join(resolvedDynamic ?? []);
  } else if (Array.isArray(resolvedDynamic) && resolvedDynamic.length) {
    normalized.dynamic_columns = join(resolvedDynamic);
  }

  return normalized;
};

export async function previewProductosImport(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('/importaciones/productos/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function confirmProductosImport({ file, mapping, mode }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mapping', JSON.stringify(mapping ?? {}));
  formData.append('mode', mode ?? 'upsert');

  const { data } = await api.post('/importaciones/productos/confirm', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}

export async function exportProductosCSV(params) {
  const response = await api.get('/importaciones/productos/export/csv', {
    params: normalizeExportParams(params),
    responseType: 'blob',
  });

  downloadBlob(
    response.data,
    `productos_${new Date().toISOString().split('T')[0]}.csv`,
    response.headers?.['content-disposition']
  );
}

export async function exportProductosExcel(params) {
  const response = await api.get('/importaciones/productos/export/excel', {
    params: normalizeExportParams(params),
    responseType: 'blob',
  });

  downloadBlob(
    response.data,
    `productos_${new Date().toISOString().split('T')[0]}.xlsx`,
    response.headers?.['content-disposition']
  );
}

export async function downloadTemplateProductosCSV(codigo) {
  if (!codigo) throw new Error('Código de template requerido');
  const response = await api.get(`/importaciones/productos/templates/${codigo}/csv`, {
    responseType: 'blob',
  });

  downloadBlob(
    response.data,
    `template_${codigo.toLowerCase()}_productos.csv`,
    response.headers?.['content-disposition']
  );
}

export async function downloadTemplateProductosExcel(codigo) {
  if (!codigo) throw new Error('Código de template requerido');
  const response = await api.get(`/importaciones/productos/templates/${codigo}/excel`, {
    responseType: 'blob',
  });

  downloadBlob(
    response.data,
    `template_${codigo.toLowerCase()}_productos.xlsx`,
    response.headers?.['content-disposition']
  );
}
