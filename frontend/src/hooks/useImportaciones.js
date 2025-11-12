import { useMutation } from '@tanstack/react-query';
import {
  previewProductosImport,
  confirmProductosImport,
  exportProductosCSV,
  exportProductosExcel,
  downloadTemplateProductosCSV,
  downloadTemplateProductosExcel,
} from '../services/importacionesService.js';

export function usePreviewProductosImport(options = {}) {
  return useMutation({
    mutationFn: previewProductosImport,
    ...options,
  });
}

export function useConfirmProductosImport(options = {}) {
  return useMutation({
    mutationFn: confirmProductosImport,
    ...options,
  });
}

export function useExportProductosCSV(options = {}) {
  return useMutation({
    mutationFn: exportProductosCSV,
    ...options,
  });
}

export function useExportProductosExcel(options = {}) {
  return useMutation({
    mutationFn: exportProductosExcel,
    ...options,
  });
}

export function useDownloadTemplateProductosCSV(options = {}) {
  return useMutation({
    mutationFn: downloadTemplateProductosCSV,
    ...options,
  });
}

export function useDownloadTemplateProductosExcel(options = {}) {
  return useMutation({
    mutationFn: downloadTemplateProductosExcel,
    ...options,
  });
}
