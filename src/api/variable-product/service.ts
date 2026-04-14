import { api } from '..'

import type { ImportStatusResponse, ImportTaskResponse } from '@/api/catalog/schema'

import type {
  CreateSpecOptionPayload,
  CreateSpecPayload,
  CreateVariableProductPayload,
  CreateVPItemPayload,
  GlobalSpecDefinition,
  ImportAllVPPayload,
  ImportFromSuperIdPayload,
  ImportVPResponse,
  ItemSpecLink,
  LinkItemSpecPayload,
  MergeSpecsPayload,
  SpecListResponse,
  SpecOption,
  SpecParams,
  UpdateSpecOptionPayload,
  UpdateSpecPayload,
  UpdateVariableProductPayload,
  VariableProduct,
  VariableProductItem,
  VariableProductListResponse,
  VariableProductParams,
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

  updateItem: async (
    vpId: string,
    itemId: string,
    payload: { active?: boolean; is_default?: boolean; sort_order?: number },
    params: { project_id?: number }
  ) => {
    await api.patch(`/variable-products/${vpId}/items/${itemId}/`, payload, { params })
  },

  removeItem: async (vpId: string, itemId: string, params: { project_id?: number }) => {
    await api.delete(`/variable-products/${vpId}/items/${itemId}/`, { params })
  },

  // ── Global Spec Definitions ─────────────────────────────────

  listSpecs: async (params: SpecParams = {}) => {
    const { data } = await api.get<SpecListResponse>('/variable-products/specs/', { params })
    return data
  },

  getSpec: async (specId: string, params: SpecParams = {}) => {
    const { data } = await api.get<GlobalSpecDefinition>(`/variable-products/specs/${specId}/`, {
      params,
    })
    return data
  },

  createSpec: async (payload: CreateSpecPayload, params: SpecParams = {}) => {
    const { data } = await api.post<GlobalSpecDefinition>('/variable-products/specs/', payload, {
      params,
    })
    return data
  },

  updateSpec: async (specId: string, payload: UpdateSpecPayload, params: SpecParams = {}) => {
    const { data } = await api.patch<GlobalSpecDefinition>(
      `/variable-products/specs/${specId}/`,
      payload,
      { params }
    )
    return data
  },

  deleteSpec: async (specId: string, params: SpecParams = {}) => {
    await api.delete(`/variable-products/specs/${specId}/`, { params })
  },

  // ── Spec Options ────────────────────────────────────────────

  listSpecOptions: async (specId: string, params: SpecParams = {}) => {
    const { data } = await api.get<SpecOption[]>(`/variable-products/specs/${specId}/options/`, {
      params,
    })
    return data
  },

  createSpecOption: async (
    specId: string,
    payload: CreateSpecOptionPayload,
    params: SpecParams = {}
  ) => {
    const { data } = await api.post<SpecOption>(
      `/variable-products/specs/${specId}/options/`,
      payload,
      { params }
    )
    return data
  },

  updateSpecOption: async (
    specId: string,
    optionId: string,
    payload: UpdateSpecOptionPayload,
    params: SpecParams = {}
  ) => {
    const { data } = await api.patch<SpecOption>(
      `/variable-products/specs/${specId}/options/${optionId}/`,
      payload,
      { params }
    )
    return data
  },

  deleteSpecOption: async (specId: string, optionId: string, params: SpecParams = {}) => {
    await api.delete(`/variable-products/specs/${specId}/options/${optionId}/`, { params })
  },

  // ── Spec Merge ──────────────────────────────────────────────

  mergeSpecs: async (targetSpecId: string, payload: MergeSpecsPayload, params: SpecParams = {}) => {
    const { data } = await api.post<GlobalSpecDefinition>(
      `/variable-products/specs/${targetSpecId}/merge/`,
      payload,
      { params }
    )
    return data
  },

  // ── Item-Spec Linking ───────────────────────────────────────

  linkItemToOption: async (
    vpId: string,
    itemId: string,
    payload: LinkItemSpecPayload,
    params: SpecParams = {}
  ) => {
    const { data } = await api.post<ItemSpecLink>(
      `/variable-products/${vpId}/items/${itemId}/specs/`,
      payload,
      { params }
    )
    return data
  },

  unlinkItemFromOption: async (
    vpId: string,
    itemId: string,
    optionId: string,
    params: SpecParams = {}
  ) => {
    await api.delete(`/variable-products/${vpId}/items/${itemId}/specs/${optionId}/`, { params })
  },

  // ── Catalog Filtering ───────────────────────────────────────

  filterBySpecs: async (filters: Record<string, string>, params: SpecParams = {}) => {
    const { data } = await api.get<VariableProductListResponse>('/variable-products/filter/', {
      params: { ...params, ...filters },
    })
    return data
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
    const { data } = await api.post<ImportTaskResponse>('/variable-products/import-all/', payload, {
      params,
    })
    return data
  },

  getImportStatus: async (taskId: string, params?: { project_id?: number }) => {
    const { data } = await api.get<ImportStatusResponse>(
      `/variable-products/import-status/${taskId}/`,
      { params }
    )
    return data
  },
}