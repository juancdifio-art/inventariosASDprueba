import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllCampos,
  getCampoById,
  getCamposPorAplicacion,
  createCampo,
  updateCampo,
  deleteCampo,
  validarValorCampo,
  getAllTemplates,
  getTemplateById,
  getTemplateByCodigo,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  aplicarTemplate,
} from '../services/configuracionCamposService.js';

const CAMPOS_KEY = ['configuracion-campos'];
const TEMPLATES_KEY = ['configuracion-campos', 'templates'];

const mergeOnSuccess = (baseHandler, extraHandler) => {
  if (!baseHandler) return extraHandler;
  return (...args) => {
    baseHandler?.(...args);
    extraHandler?.(...args);
  };
};

export function useConfiguracionCamposList(params = {}, options = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...CAMPOS_KEY, 'list', params],
    queryFn: () => getAllCampos(params),
    keepPreviousData: true,
    ...options,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: CAMPOS_KEY });

  return { ...query, invalidate };
}

export function useConfiguracionCampo(id, options = {}) {
  return useQuery({
    queryKey: [...CAMPOS_KEY, 'detail', id],
    queryFn: () => getCampoById(id),
    enabled: Boolean(id) && (options.enabled ?? true),
    ...options,
  });
}

export function useCamposPorAplicacion(aplicaA, params = {}, options = {}) {
  return useQuery({
    queryKey: [...CAMPOS_KEY, 'aplicacion', aplicaA, params],
    queryFn: () => getCamposPorAplicacion(aplicaA, params),
    enabled: Boolean(aplicaA) && (options.enabled ?? true),
    ...options,
  });
}

export function useCreateConfiguracionCampo(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: createCampo,
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: CAMPOS_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useUpdateConfiguracionCampo(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ id, payload }) => updateCampo(id, payload),
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: CAMPOS_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useDeleteConfiguracionCampo(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: deleteCampo,
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: CAMPOS_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useValidarValorCampo(options = {}) {
  return useMutation({
    mutationFn: ({ id, valor }) => validarValorCampo(id, valor),
    ...options,
  });
}

export function useTemplatesList(params = {}, options = {}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...TEMPLATES_KEY, 'list', params],
    queryFn: () => getAllTemplates(params),
    keepPreviousData: true,
    ...options,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });

  return { ...query, invalidate };
}

export function useTemplateById(id, options = {}) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, 'detail', 'id', id],
    queryFn: () => getTemplateById(id),
    enabled: Boolean(id) && (options.enabled ?? true),
    ...options,
  });
}

export function useTemplateByCodigo(codigo, options = {}) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, 'detail', 'codigo', codigo],
    queryFn: () => getTemplateByCodigo(codigo),
    enabled: Boolean(codigo) && (options.enabled ?? true),
    ...options,
  });
}

export function useCreateTemplate(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useUpdateTemplate(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: ({ id, payload }) => updateTemplate(id, payload),
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useDeleteTemplate(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }, onSuccess),
    ...rest,
  });
}

export function useAplicarTemplate(options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options;
  return useMutation({
    mutationFn: aplicarTemplate,
    onSuccess: mergeOnSuccess(() => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: CAMPOS_KEY });
    }, onSuccess),
    ...rest,
  });
}
