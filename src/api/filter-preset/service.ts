import { api } from '..'

import type {
  CreateFilterPresetPayload,
  FilterPreset,
  FilterPresetParams,
  UpdateFilterPresetPayload,
} from './schema'

export const filterPresetService = {
  get: async (params?: FilterPresetParams) => {
    const { data } = await api.get<FilterPreset[]>('/data/filter-presets/', { params })
    return data
  },

  getById: async (id: number, params?: { project_id?: number }) => {
    const { data } = await api.get<FilterPreset>(`/data/filter-presets/${id}/`, { params })
    return data
  },

  create: async (payload: CreateFilterPresetPayload, params?: { project_id?: number }) => {
    const { data } = await api.post<FilterPreset>('/data/filter-presets/', payload, { params })
    return data
  },

  update: async (id: number, payload: UpdateFilterPresetPayload, params?: { project_id?: number }) => {
    const { data } = await api.patch<FilterPreset>(`/data/filter-presets/${id}/`, payload, {
      params,
    })
    return data
  },

  delete: async (id: number, params?: { project_id?: number }) => {
    await api.delete(`/data/filter-presets/${id}/`, { params })
  },
}