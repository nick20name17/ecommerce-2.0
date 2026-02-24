import { queryOptions } from '@tanstack/react-query'

import type { CategoryParams } from './schema'
import { categoryService } from './service'

export const CATEGORY_QUERY_KEYS = {
  all: () => ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all(), 'list'] as const,
  list: (params: CategoryParams = {}) => [...CATEGORY_QUERY_KEYS.lists(), params] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all(), 'detail'] as const,
  detail: (treeId: string) => [...CATEGORY_QUERY_KEYS.details(), treeId] as const,
}

export const getCategoriesQuery = (params: CategoryParams = {}) =>
  queryOptions({
    queryKey: CATEGORY_QUERY_KEYS.list(params),
    queryFn: () => categoryService.get(params),
  })

export const getCategoryByTreeIdQuery = (treeId: string, params?: { project_id?: number }) =>
  queryOptions({
    queryKey: [...CATEGORY_QUERY_KEYS.detail(treeId), params ?? {}] as const,
    queryFn: () => categoryService.getByTreeId(treeId, params),
    enabled: !!treeId,
  })

