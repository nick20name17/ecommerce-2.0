import { api } from '..'

import type { Salesperson } from './schema'

export const salespersonService = {
  getAll: async () => {
    const { data } = await api.get<Salesperson[]>('/data/salespersons/')
    return data
  }
}
