import { api } from '..'

import type { Category, CategoryListResponse, CategoryParams } from './schema'

export const categoryService = {
  get: async (params: CategoryParams = {}) => {
    const { data } = await api.get<CategoryListResponse>('/data/categories/', { params })
    return data
  },

  getByTreeId: async (treeId: string, params?: { project_id?: number }) => {
    const { data } = await api.get<Category>(`/data/categories/${treeId}/`, { params })
    return data
  },
}

