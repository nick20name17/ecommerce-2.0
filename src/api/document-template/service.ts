import { api } from '..'

import type {
  CreateDocumentTemplatePayload,
  DocumentTemplate,
  DocumentTemplateListParams,
  UpdateDocumentTemplatePayload,
} from './schema'

const params = (projectId?: number | null) =>
  projectId != null ? { project_id: projectId } : {}

export const documentTemplateService = {
  list: async (
    filters: DocumentTemplateListParams = {},
    projectId?: number | null
  ) => {
    const query: Record<string, unknown> = { ...params(projectId) }
    if (filters.entity_type) query.entity_type = filters.entity_type
    if (filters.accessible_from) query.accessible_from = filters.accessible_from
    if (filters.is_active !== undefined) query.is_active = filters.is_active
    const { data } = await api.get<DocumentTemplate[]>('/data/document-templates/', {
      params: query,
    })
    return data
  },

  getById: async (id: number, projectId?: number | null) => {
    const { data } = await api.get<DocumentTemplate>(
      `/data/document-templates/${id}/`,
      { params: params(projectId) }
    )
    return data
  },

  create: async (
    payload: CreateDocumentTemplatePayload,
    projectId?: number | null
  ) => {
    const { data } = await api.post<DocumentTemplate>(
      '/data/document-templates/',
      payload,
      { params: params(projectId) }
    )
    return data
  },

  update: async (
    id: number,
    payload: UpdateDocumentTemplatePayload,
    projectId?: number | null
  ) => {
    const { data } = await api.patch<DocumentTemplate>(
      `/data/document-templates/${id}/`,
      payload,
      { params: params(projectId) }
    )
    return data
  },

  delete: async (id: number, projectId?: number | null) => {
    await api.delete(`/data/document-templates/${id}/`, {
      params: params(projectId),
    })
  },

  /**
   * Render a template to PDF for a specific entity.
   * Returns the PDF as a Blob — caller is responsible for opening or
   * downloading it (URL.createObjectURL + window.open is the typical move).
   */
  render: async (
    id: number,
    entityId: string,
    projectId?: number | null
  ): Promise<Blob> => {
    const { data } = await api.post<Blob>(
      `/data/document-templates/${id}/render/`,
      null,
      {
        params: { ...params(projectId), entity_id: entityId },
        responseType: 'blob',
      }
    )
    return data
  },
}
