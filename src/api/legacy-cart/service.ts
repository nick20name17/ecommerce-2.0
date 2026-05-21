import { api } from '..'

import type { LegacyCartParams, LegacyCartResponse } from './schema'

export const legacyCartService = {
  get: async (params: LegacyCartParams = {}) => {
    const { data } = await api.get<LegacyCartResponse>('/data/legacy-carts/', { params })
    return data
  }
}
