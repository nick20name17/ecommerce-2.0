import { queryOptions } from '@tanstack/react-query'

import { storefrontConfigService } from './service'

export const STOREFRONT_CONFIG_QUERY_KEYS = {
  all: () => ['storefront-config'] as const,
  byProject: (projectId: number) =>
    [...STOREFRONT_CONFIG_QUERY_KEYS.all(), projectId] as const
}

export const getStorefrontConfigQuery = (projectId: number) =>
  queryOptions({
    queryKey: STOREFRONT_CONFIG_QUERY_KEYS.byProject(projectId),
    queryFn: () => storefrontConfigService.get(projectId),
    enabled: !!projectId
  })
