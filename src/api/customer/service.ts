import { api } from '..'

import type { Customer, CustomerParams, CustomerResponse } from './schema'

export const customerService = {
  get: async (params: CustomerParams) => {
    const { data } = await api.get<CustomerResponse>('/data/customers/', { params })
    return data
  },

  getById: async (id: string, params?: { fields?: string; project_id?: number }) => {
    const { data } = await api.get<Customer>(`/data/customers/${id}/`, { params })
    return data
  },
}
