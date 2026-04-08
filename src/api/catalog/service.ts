import { api } from '..'

import type {
  CatalogCategory,
  CatalogCategoryItem,
  CatalogListResponse,
  CatalogParams,
  CatalogTreeParams,
  CatalogTreeResponse,
  CreateCatalogCategoryPayload,
  CreateCatalogItemPayload,
  ImportFromInventrePayload,
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

  // ── Category Items ───────────────────────────────────────────

  addItem: async (
    categoryId: string,
    payload: CreateCatalogItemPayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post<CatalogCategoryItem>(
      `/catalog/${categoryId}/items/`,
      payload,
      { params }
    )
    return data
  },

  removeItem: async (
    categoryId: string,
    itemRecordId: string,
    params: { project_id?: number }
  ) => {
    await api.delete(`/catalog/${categoryId}/items/${itemRecordId}/`, { params })
  },

  // ── Import ───────────────────────────────────────────────────

  importFromInventre: async (
    payload: ImportFromInventrePayload,
    params: { project_id?: number }
  ) => {
    const { data } = await api.post('/catalog/import-from-inventre/', payload, { params })
    return data
  },
}
