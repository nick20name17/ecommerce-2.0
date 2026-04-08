import { api } from '..'

import type {
  CreateVariableProductPayload,
  CreateVPItemPayload,
  CreateVPSpecPayload,
  CreateVPSpecValuePayload,
  ImportAllVPPayload,
  ImportFromSuperIdPayload,
  ImportVPResponse,
  UpdateVariableProductPayload,
  UpdateVPSpecPayload,
  UpdateVPSpecValuePayload,
  VariableProduct,
  VariableProductItem,
  VariableProductListResponse,
  VariableProductParams,
  VariableProductSpec,
  VariableProductSpecValue,
} from './schema'

export const variableProductService = {
  // ── Variable Products CRUD ───────────────────────────────────

  list: async (params: VariableProductParams = {}) => {
    const { data } = await api.get<VariableProductListResponse>('/variable-products/', { params })
    return data
  },

  getById: async (id: string, params?: { customer_id?: string; project_id?: number }) => {
    const { data } = await api.get<VariableProduct>(`/variable-products/${id}/`, { params })
    return data
  },

  create: async (payload: CreateVariableProductPayload, params: { project_id?: number }) => {
    const { data } = await api.post<VariableProduct>('/variable-products/', payload, { params })
    return data
  },

  update: async (
    id: string,
    payload: UpdateVariableProductPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.patch<VariableProduct>(`/variable-products/${id}/`, payload, {
      params,
    })
    return data
  },

  delete: async (id: string, params: { project_id?: number }) => {
    await api.delete(`/variable-products/${id}/`, { params })
  },

  // ── Items ────────────────────────────────────────────────────

  addItem: async (vpId: string, payload: CreateVPItemPayload, params: { project_id?: number }) => {
    const { data } = await api.post<VariableProductItem>(
      `/variable-products/${vpId}/items/`,
      payload,
      { params }
    )
    return data
  },

  removeItem: async (vpId: string, itemId: string, params: { project_id?: number }) => {
    await api.delete(`/variable-products/${vpId}/items/${itemId}/`, { params })
  },

  // ── Spec Definitions ─────────────────────────────────────────

  addSpec: async (vpId: string, payload: CreateVPSpecPayload, params: { project_id?: number }) => {
    const { data } = await api.post<VariableProductSpec>(
      `/variable-products/${vpId}/specs/`,
      payload,
      { params }
    )
    return data
  },

  updateSpec: async (
    vpId: string,
    specId: string,
    payload: UpdateVPSpecPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.patch<VariableProductSpec>(
      `/variable-products/${vpId}/specs/${specId}/`,
      payload,
      { params }
    )
    return data
  },

  deleteSpec: async (vpId: string, specId: string, params: { project_id?: number }) => {
    await api.delete(`/variable-products/${vpId}/specs/${specId}/`, { params })
  },

  // ── Spec Values ──────────────────────────────────────────────

  addSpecValue: async (
    vpId: string,
    specId: string,
    payload: CreateVPSpecValuePayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post<VariableProductSpecValue>(
      `/variable-products/${vpId}/specs/${specId}/values/`,
      payload,
      { params }
    )
    return data
  },

  updateSpecValue: async (
    vpId: string,
    specId: string,
    valueId: string,
    payload: UpdateVPSpecValuePayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.patch<VariableProductSpecValue>(
      `/variable-products/${vpId}/specs/${specId}/values/${valueId}/`,
      payload,
      { params }
    )
    return data
  },

  deleteSpecValue: async (
    vpId: string,
    specId: string,
    valueId: string,
    params: { project_id?: number }
  ) => {
    await api.delete(`/variable-products/${vpId}/specs/${specId}/values/${valueId}/`, { params })
  },

  // ── Import ───────────────────────────────────────────────────

  importFromSuperId: async (payload: ImportFromSuperIdPayload, params: { project_id?: number }) => {
    const { data } = await api.post<ImportVPResponse>(
      '/variable-products/import-from-super-id/',
      payload,
      { params }
    )
    return data
  },

  importAll: async (payload: ImportAllVPPayload, params: { project_id?: number }) => {
    const { data } = await api.post<ImportVPResponse>('/variable-products/import-all/', payload, {
      params,
    })
    return data
  },
}
