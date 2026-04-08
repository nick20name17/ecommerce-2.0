import { queryOptions } from '@tanstack/react-query'

import type { CatalogParams, CatalogTreeParams } from './schema'
import { catalogService } from './service'

export const CATALOG_QUERY_KEYS = {
  all: () => ['catalog'] as const,
  trees: () => [...CATALOG_QUERY_KEYS.all(), 'tree'] as const,
  tree: (params: CatalogTreeParams = {}) => [...CATALOG_QUERY_KEYS.trees(), params] as const,
  lists: () => [...CATALOG_QUERY_KEYS.all(), 'list'] as const,
  list: (params: CatalogParams = {}) => [...CATALOG_QUERY_KEYS.lists(), params] as const,
  details: () => [...CATALOG_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...CATALOG_QUERY_KEYS.details(), id] as const,
}

export const getCatalogTreeQuery = (params: CatalogTreeParams = {}) =>
  queryOptions({
    queryKey: CATALOG_QUERY_KEYS.tree(params),
    queryFn: () => catalogService.getTree(params),
  })

export const getCatalogListQuery = (params: CatalogParams = {}) =>
  queryOptions({
    queryKey: CATALOG_QUERY_KEYS.list(params),
    queryFn: () => catalogService.list(params),
  })

export const getCatalogDetailQuery = (id: string, params?: { project_id?: number }) =>
  queryOptions({
    queryKey: [...CATALOG_QUERY_KEYS.detail(id), params ?? {}] as const,
    queryFn: () => catalogService.getById(id, params),
    enabled: !!id,
  })
