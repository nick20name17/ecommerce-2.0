import { api } from '..'

import type { MetaTagsData } from './schema'

export const metaService = {
  get: async (params: {
    entity_type: string
    entity_id: string
    project_id?: number
  }) => {
    const { data } = await api.get<MetaTagsData>('/meta/', { params })
    return data
  },

  upsert: async (
    payload: {
      entity_type: string
      entity_id: string
      meta_title?: string
      meta_description?: string
    },
    params?: { project_id?: number }
  ) => {
    const { data } = await api.post<MetaTagsData>('/meta/', payload, { params })
    return data
  },
}
