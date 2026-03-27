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

export const pickListService = {
  get: async (params: PickListParams) => {
    const { data } = await api.get<PickListResponse>('/pick-lists/', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<PickList>(`/pick-lists/${id}/`)
    return data
  },

  create: async (payload: CreatePickListPayload) => {
    const { data } = await api.post<PickList>('/pick-lists/', payload)
    return data
  },

  update: async (id: number, payload: UpdatePickListPayload) => {
    const { data } = await api.patch<PickList>(`/pick-lists/${id}/`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/pick-lists/${id}/`)
  },

  // ── Items ───────────────────────────────────────────────

  addItems: async (id: number, payload: AddItemsPayload) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/items/`, payload)
    return data
  },

  updateItem: async (id: number, itemId: number, payload: UpdateItemPayload) => {
    const { data } = await api.patch<PickList>(`/pick-lists/${id}/items/${itemId}/`, payload)
    return data
  },

  removeItem: async (id: number, itemId: number) => {
    await api.delete(`/pick-lists/${id}/items/${itemId}/`)
  },

  // ── Push to EBMS ──────────────────────────────────────

  push: async (id: number) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/push/`)
    return data
  },

  // ── Shipping ──────────────────────────────────────────

  getShippingRates: async (id: number, payload: ShippingRatesRequest) => {
    const { data } = await api.post<ShippingRatesResponse>(
      `/pick-lists/${id}/shipping-rates/`,
      payload,
    )
    return data
  },

  selectShippingRate: async (id: number, rateId: string) => {
    const { data } = await api.post<ShippingSelectionResponse>(
      `/pick-lists/${id}/shipping-selection/`,
      { rate_id: rateId },
    )
    return data
  },

  voidLabel: async (id: number) => {
    const { data } = await api.post<PickList>(`/pick-lists/${id}/void/`)
    return data
  },
}
