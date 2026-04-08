import { queryOptions } from '@tanstack/react-query'

import type { VariableProductParams } from './schema'
import { variableProductService } from './service'

export const VP_QUERY_KEYS = {
  all: () => ['variable-products'] as const,
  lists: () => [...VP_QUERY_KEYS.all(), 'list'] as const,
  list: (params: VariableProductParams = {}) => [...VP_QUERY_KEYS.lists(), params] as const,
  details: () => [...VP_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...VP_QUERY_KEYS.details(), id] as const,
}

export const getVariableProductsQuery = (params: VariableProductParams = {}) =>
  queryOptions({
    queryKey: VP_QUERY_KEYS.list(params),
    queryFn: () => variableProductService.list(params),
  })

export const getVariableProductDetailQuery = (
  id: string,
  params?: { customer_id?: string; project_id?: number }
) =>
  queryOptions({
    queryKey: [...VP_QUERY_KEYS.detail(id), params ?? {}] as const,
    queryFn: () => variableProductService.getById(id, params),
    enabled: !!id,
  })
