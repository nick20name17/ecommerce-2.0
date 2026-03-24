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

  getById: async (id: number) => {
    const { data } = await api.get<FilterPreset>(`/data/filter-presets/${id}/`)
    return data
  },

  create: async (payload: CreateFilterPresetPayload) => {
    const { data } = await api.post<FilterPreset>('/data/filter-presets/', payload)
    return data
  },

  update: async (id: number, payload: UpdateFilterPresetPayload) => {
    const { data } = await api.patch<FilterPreset>(`/data/filter-presets/${id}/`, payload)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/data/filter-presets/${id}/`)
  },
}
