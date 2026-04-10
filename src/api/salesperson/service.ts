import { api } from '..'

import type { Salesperson } from './schema'

export const salespersonService = {
  getAll: async (params?: { project_id?: number }) => {
    const { data } = await api.get<Salesperson[]>('/data/salespersons/', { params })
    return data
  }
}