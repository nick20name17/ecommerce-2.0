import { api } from '..'

import type { EntityAssignRequest, EntityAssignmentResponse } from '../schema'

import type {
  CreateCustomerPayload,
  Customer,
  CustomerParams,
  CustomerResponse,
  UpdateCustomerPayload
} from './schema'

export const customerService = {
  get: async (params: CustomerParams) => {
    const { data } = await api.get<CustomerResponse>('/data/customers/', { params })
    return data
  },

  getById: async (id: string, params?: { fields?: string; project_id?: number }) => {
    const { data } = await api.get<Customer>(`/data/customers/${id}/`, { params })
    return data
  },

  create: async (payload: CreateCustomerPayload) => {
    const { data } = await api.post<Customer>('/data/customers/', payload)
    return data
  },

  update: async (id: string, payload: UpdateCustomerPayload) => {
    const { data } = await api.patch<Customer>(`/data/customers/${id}/`, payload)
    return data
  },

  delete: async (id: string, projectId?: number | null) => {
    await api.delete(`/data/customers/${id}/`, {
      params: projectId != null ? { project_id: projectId } : {}
    })
  },

  assign: async (autoid: string, payload: EntityAssignRequest, projectId?: number | null) => {
    const { data } = await api.post<EntityAssignmentResponse>(
      `/data/customers/${autoid}/assign/`,
      payload,
      { params: projectId != null ? { project_id: projectId } : {} }
    )
    return data
  }
}
