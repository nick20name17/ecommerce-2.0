import { api } from '..'

import type {
  CatalogImageItem,
  CatalogImageListResponse,
  PresignedUploadResponse,
} from './schema'
import type { ImportStatusResponse, ImportTaskResponse } from '@/api/catalog/schema'

export const catalogImageService = {
  list: async (params: {
    entity_type: string
    entity_id: string
    project_id?: number
  }) => {
    const { data } = await api.get<CatalogImageListResponse>('/catalog-images/', {
      params,
    })
    return data
  },

  getPresignedUrl: async (
    payload: {
      entity_type: string
      entity_id: string
      filename: string
      content_type: string
    },
    params?: { project_id?: number }
  ) => {
    const { data } = await api.post<PresignedUploadResponse>(
      '/catalog-images/',
      payload,
      { params }
    )
    return data
  },

  confirmUpload: async (
    payload: {
      entity_type: string
      entity_id: string
      s3_key: string
      original_filename: string
      content_type?: string
      alt?: string
      is_primary?: boolean
    },
    params?: { project_id?: number }
  ) => {
    const { data } = await api.post<CatalogImageItem>(
      '/catalog-images/confirm/',
      payload,
      { params }
    )
    return data
  },

  update: async (
    imageId: number,
    payload: { alt?: string; sort_order?: number; is_primary?: boolean },
    params?: { project_id?: number }
  ) => {
    const { data } = await api.patch<CatalogImageItem>(
      `/catalog-images/${imageId}/`,
      payload,
      { params }
    )
    return data
  },

  delete: async (imageId: number, params?: { project_id?: number }) => {
    await api.delete(`/catalog-images/${imageId}/`, { params })
  },

  startImport: async (params: { project_id?: number }) => {
    const { data } = await api.post<ImportTaskResponse>(
      '/catalog-images/import/',
      {},
      { params }
    )
    return data
  },

  getImportStatus: async (taskId: string, params?: { project_id?: number }) => {
    const { data } = await api.get<ImportStatusResponse>(
      `/catalog-images/import-status/${taskId}/`,
      { params }
    )
    return data
  },

  cancelImport: async (taskId: string, params?: { project_id?: number }) => {
    await api.post(`/catalog-images/cancel/${taskId}/`, {}, { params })
  },
}