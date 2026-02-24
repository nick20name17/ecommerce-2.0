import { queryOptions } from '@tanstack/react-query'

import type { ProductParams } from './schema'
import { productService } from './service'

export type ProductListParams = ProductParams & {
  customer_id?: string
  project_id?: number
}

export const PRODUCT_QUERY_KEYS = {
  all: () => ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all(), 'list'] as const,
  list: (params: ProductListParams = {}) => [...PRODUCT_QUERY_KEYS.lists(), params] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all(), 'detail'] as const,
  detail: (autoid: string) => [...PRODUCT_QUERY_KEYS.details(), autoid] as const,
  configurations: (autoid: string, params: { customer_id: string; project_id?: number }) =>
    [...PRODUCT_QUERY_KEYS.detail(autoid), 'configurations', params] as const,
}

export const getProductsQuery = (params: ProductListParams = {}) =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => productService.get(params),
  })

export const getProductConfigurationsQuery = (
  autoid: string,
  params: { customer_id: string; project_id?: number }
) =>
  queryOptions({
    queryKey: PRODUCT_QUERY_KEYS.configurations(autoid, params),
    queryFn: () => productService.getConfigurations(autoid, params),
    enabled: !!autoid && !!params.customer_id,
  })

export const getProductByAutoidQuery = (
  autoid: string,
  params?: { customer_id?: string; project_id?: number }
) =>
  queryOptions({
    queryKey: [...PRODUCT_QUERY_KEYS.detail(autoid), params ?? {}] as const,
    queryFn: () => productService.getByAutoid(autoid, params),
    enabled: !!autoid,
  })
