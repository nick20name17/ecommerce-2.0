import { api } from '..'

import type {
  AddCatalogProductPayload,
  AddCatalogVPPayload,
  CatalogCategory,
  CatalogCategoryProduct,
  CatalogCategoryVP,
  CatalogListResponse,
  CatalogParams,
  CatalogTreeParams,
  CatalogTreeResponse,
  CreateCatalogCategoryPayload,
  ImportFromInventrePayload,
  ImportStatusResponse,
  ImportTaskResponse,
  UpdateCatalogCategoryPayload,
} from './schema'

export const catalogService = {
  // ── Tree ─────────────────────────────────────────────────────

  getTree: async (params: CatalogTreeParams) => {
    const { data } = await api.get<CatalogTreeResponse>('/catalog/tree/', { params })
    return data
  },

  // ── Categories ───────────────────────────────────────────────

  list: async (params: CatalogParams = {}) => {
    const { data } = await api.get<CatalogListResponse>('/catalog/', { params })
    return data
  },

  getById: async (id: string, params?: { project_id?: number }) => {
    const { data } = await api.get<CatalogCategory>(`/catalog/${id}/`, { params })
    return data
  },

  create: async (payload: CreateCatalogCategoryPayload, params: { project_id?: number }) => {
    const { data } = await api.post<CatalogCategory>('/catalog/', payload, { params })
    return data
  },

  update: async (
    id: string,
    payload: UpdateCatalogCategoryPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.patch<CatalogCategory>(`/catalog/${id}/`, payload, { params })
    return data
  },

  delete: async (id: string, params: { project_id?: number }) => {
    await api.delete(`/catalog/${id}/`, { params })
  },

  // ── Category Products ─────────────────────────────────────────

  addProduct: async (
    categoryId: string,
    payload: AddCatalogProductPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post<CatalogCategoryProduct>(
      `/catalog/${categoryId}/products/`,
      payload,
      { params }
    )
    return data
  },

  updateProduct: async (
    categoryId: string,
    recordId: string,
    payload: { active?: boolean; sort_order?: number },
    params: { project_id?: number }
  ) => {
    await api.patch(`/catalog/${categoryId}/products/${recordId}/`, payload, { params })
  },

  removeProduct: async (
    categoryId: string,
    recordId: string,
    params: { project_id?: number }
  ) => {
    await api.delete(`/catalog/${categoryId}/products/${recordId}/`, { params })
  },

  // ── Category Variable Products ──────────────────────────────

  addVariableProduct: async (
    categoryId: string,
    payload: AddCatalogVPPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post<CatalogCategoryVP>(
      `/catalog/${categoryId}/variable-products/`,
      payload,
      { params }
    )
    return data
  },

  removeVariableProduct: async (
    categoryId: string,
    recordId: string,
    params: { project_id?: number }
  ) => {
    await api.delete(`/catalog/${categoryId}/variable-products/${recordId}/`, { params })
  },

  // ── Import ───────────────────────────────────────────────────

  importFromInventre: async (
    payload: ImportFromInventrePayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post<ImportTaskResponse>('/catalog/import-from-inventre/', payload, {
      params,
    })
    return data
  },

  getImportStatus: async (taskId: string, params?: { project_id?: number }) => {
    const { data } = await api.get<ImportStatusResponse>(
      `/catalog/import-status/${taskId}/`,
      { params }
    )
    return data
  },
}
