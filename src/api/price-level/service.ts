import { api } from '..'

export const priceLevelService = {
  get: async (projectId?: number | null) => {
    const { data } = await api.get<string[]>('/data/price-levels/', {
      params: projectId ? { project_id: projectId } : undefined
    })
    return data
  }
}
