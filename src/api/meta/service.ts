import { api } from '..'

export interface MetaData {
  id: string | null
  meta_title: string
  meta_description: string
}

export const metaService = {
  get: async (params: { entity_type: string; entity_id: string; project_id?: number }) => {
    const { data } = await api.get<MetaData>('/meta/', { params })
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
    const { data } = await api.post<MetaData>('/meta/', payload, { params })
    return data
  },
}
