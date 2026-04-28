import { queryOptions } from '@tanstack/react-query'

import type { SpecParams, VariableProductParams } from './schema'
import { variableProductService } from './service'

export const VP_QUERY_KEYS = {
  all: () => ['variable-products'] as const,
  lists: () => [...VP_QUERY_KEYS.all(), 'list'] as const,
  list: (params: VariableProductParams = {}) => [...VP_QUERY_KEYS.lists(), params] as const,
  details: () => [...VP_QUERY_KEYS.all(), 'detail'] as const,
  detail: (id: string) => [...VP_QUERY_KEYS.details(), id] as const,
  specs: () => [...VP_QUERY_KEYS.all(), 'specs'] as const,
  specList: (params: SpecParams = {}) => [...VP_QUERY_KEYS.specs(), 'list', params] as const,
  specDetail: (specId: string) => [...VP_QUERY_KEYS.specs(), 'detail', specId] as const,
  specOptions: (specId: string) => [...VP_QUERY_KEYS.specs(), 'options', specId] as const,
  filter: (filters: Record<string, string>) => [...VP_QUERY_KEYS.all(), 'filter', filters] as const,
}

const STALE_5M = 5 * 60 * 1000
const GC_30M = 30 * 60 * 1000

export const getVariableProductsQuery = (params: VariableProductParams = {}) =>
  queryOptions({
    queryKey: VP_QUERY_KEYS.list(params),
    queryFn: () => variableProductService.list(params),
    staleTime: STALE_5M,
    gcTime: GC_30M,
  })

export const getVariableProductDetailQuery = (
  id: string,
  params?: { customer_id?: string; project_id?: number }
) =>
  queryOptions({
    queryKey: [...VP_QUERY_KEYS.detail(id), params ?? {}] as const,
    queryFn: () => variableProductService.getById(id, params),
    enabled: !!id,
    staleTime: STALE_5M,
    gcTime: GC_30M,
  })

export const getSpecsQuery = (params: SpecParams = {}) =>
  queryOptions({
    queryKey: VP_QUERY_KEYS.specList(params),
    queryFn: () => variableProductService.listSpecs(params),
    staleTime: STALE_5M,
    gcTime: GC_30M,
  })

export const getSpecDetailQuery = (specId: string, params: SpecParams = {}) =>
  queryOptions({
    queryKey: [...VP_QUERY_KEYS.specDetail(specId), params] as const,
    queryFn: () => variableProductService.getSpec(specId, params),
    enabled: !!specId,
    staleTime: STALE_5M,
    gcTime: GC_30M,
  })

export const getSpecOptionsQuery = (specId: string, params: SpecParams = {}) =>
  queryOptions({
    queryKey: [...VP_QUERY_KEYS.specOptions(specId), params] as const,
    queryFn: () => variableProductService.listSpecOptions(specId, params),
    enabled: !!specId,
    staleTime: STALE_5M,
    gcTime: GC_30M,
  })

export const getFilteredVPQuery = (
  filters: Record<string, string>,
  params: SpecParams = {}
) =>
  queryOptions({
    queryKey: VP_QUERY_KEYS.filter(filters),
    queryFn: () => variableProductService.filterBySpecs(filters, params),
    enabled: Object.keys(filters).length > 0,
    staleTime: STALE_5M,
  })
