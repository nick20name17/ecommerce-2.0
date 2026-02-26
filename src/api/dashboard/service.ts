import { api } from '..'

import type { DashboardMetrics, DashboardParams } from './schema'

export const dashboardService = {
  get: async (params?: DashboardParams) => {
    const { data } = await api.get<DashboardMetrics>('/data/dashboard/', {
      params
    })
    return data
  }
}
