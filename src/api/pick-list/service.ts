import { api } from '..'

import type {
  AddItemsPayload,
  CreatePickListPayload,
  PickList,
  PickListParams,
  PickListResponse,
  ShippingRatesRequest,
  ShippingRatesResponse,
  ShippingSelectionResponse,
  UpdateItemPayload,
  UpdatePickListPayload,
} from './schema'

const pickListParams = (projectId?: number | null): Record<string, string | number> =>
  projectId != null ? { project_id: projectId } : {}

const withReset = (projectId: number | null | undefined, resetShipped: boolean) => {
  const params = pickListParams(projectId)
  if (resetShipped) params.reset_shipped = 'true'
  return params
}

export const pickListService = {
  get: async (params: PickListParams) => {
    const { data } = await api.get<PickListResponse>('/pick-lists/', { params })
    return data
  },

  getById: async (id: number, projectId?: number | null) => {
    const { data } = await api.get<PickList>(`/pick-lists/${id}/`, {
      params: pickListParams(projectId),
    })
    return data
  },

  create: async (payload: CreatePickListPayload, projectId?: number | null) => {
    const { data } = await api.post<PickList>('/pick-lists/', payload, {
      params: pickListParams(projectId),
    })
    return data
  },

  update: async (id: number, payload: UpdatePickListPayload, projectId?: number | null) => {
    const { data } = await api.patch<PickList>(`/pick-lists/${id}/`, payload, {
      params: pickListParams(projectId),
    })
    return data
  },

  delete: async (id: number, resetShipped = false, projectId?: number | null) => {
    await api.delete(`/pick-lists/${id}/`, {
      params: withReset(projectId, resetShipped),
    })
  },

  // ── Items ───────────────────────────────────────────────

  addItems: async (id: number, payload: AddItemsPayload, projectId?: number | null) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/items/`, payload, {
      params: pickListParams(projectId),
    })
    return data
  },

  updateItem: async (
    id: number,
    itemId: number,
    payload: UpdateItemPayload,
    projectId?: number | null,
  ) => {
    const { data } = await api.patch<PickList>(
      `/pick-lists/${id}/items/${itemId}/`,
      payload,
      { params: pickListParams(projectId) },
    )
    return data
  },

  removeItem: async (
    id: number,
    itemId: number,
    resetShipped = false,
    projectId?: number | null,
  ) => {
    await api.delete(`/pick-lists/${id}/items/${itemId}/`, {
      params: withReset(projectId, resetShipped),
    })
  },

  // ── Push to EBMS ──────────────────────────────────────

  push: async (id: number, projectId?: number | null) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/push/`, null, {
      params: pickListParams(projectId),
    })
    return data
  },

  // ── Shipping ──────────────────────────────────────────

  getShippingRates: async (
    id: number,
    payload: ShippingRatesRequest,
    projectId?: number | null,
  ) => {
    const { data } = await api.post<ShippingRatesResponse>(
      `/pick-lists/${id}/shipping-rates/`,
      payload,
      { params: pickListParams(projectId) },
    )
    return data
  },

  selectShippingRate: async (id: number, rateId: string, projectId?: number | null) => {
    const { data } = await api.post<ShippingSelectionResponse>(
      `/pick-lists/${id}/shipping-selection/`,
      { rate_id: rateId },
      { params: pickListParams(projectId) },
    )
    return data
  },

  voidLabel: async (id: number, projectId?: number | null) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/void/`, null, {
      params: pickListParams(projectId),
    })
    return data
  },
}
