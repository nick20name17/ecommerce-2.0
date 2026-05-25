import { api } from '..'

import type { StorefrontConfig } from './schema'

export const storefrontConfigService = {
  get: async (projectId: number) => {
    const { data } = await api.get<StorefrontConfig>(
      `/projects/${projectId}/storefront-config/`
    )
    return data
  },

  update: async (projectId: number, config: StorefrontConfig) => {
    const { data } = await api.patch<StorefrontConfig>(
      `/projects/${projectId}/storefront-config/`,
      config
    )
    return data
  }
}
