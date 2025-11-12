import useApiQuery from './useApiQuery.js'

export function useDashboardSummary(params = {}, options = {}) {
  const enabled = options.enabled ?? true

  return useApiQuery(['dashboard', 'summary', params], {
    url: '/dashboard/summary',
    params,
    enabled,
    ...options,
  })
}
