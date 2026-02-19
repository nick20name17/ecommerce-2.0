import { api } from '..'

import type {
  ConfigurationProduct,
  Product,
  ProductParams,
  ProductResponse,
} from './schema'

export const productService = {
  get: async (params: ProductParams & { customer_id?: string; project_id?: number }) => {
    const { data } = await api.get<ProductResponse>('/data/products-with-price/', { params })
    return data
  },

  getByAutoid: async (
    autoid: string,
    params?: { customer_id?: string; project_id?: number }
  ) => {
    const { data } = await api.get<Product>(`/data/products/${autoid}/`, { params })
    return data
  },

  getConfigurations: async (
    autoid: string,
    params: { customer_id: string; project_id?: number }
  ) => {
    const { data } = await api.get<ConfigurationProduct>(
      `/data/products-with-price/${autoid}/configurations/`,
      { params }
    )
    return data
  },
}
