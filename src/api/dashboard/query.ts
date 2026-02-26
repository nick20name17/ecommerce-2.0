import { queryOptions } from '@tanstack/react-query'

import type { DashboardParams } from './schema'
import { dashboardService } from './service'

export const DASHBOARD_QUERY_KEYS = {
  all: () => ['dashboard'] as const,
  details: () => [...DASHBOARD_QUERY_KEYS.all(), 'detail'] as const,
  detail: (params: DashboardParams = {}) =>
    [...DASHBOARD_QUERY_KEYS.details(), params] as const
}

export const getDashboardQuery = (params: DashboardParams = {}) =>
  queryOptions({
    queryKey: DASHBOARD_QUERY_KEYS.detail(params),
    queryFn: () => dashboardService.get(params)
  })
