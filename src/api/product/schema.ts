import type { PaginatedResponse, PaginationParams } from '../schema'

export interface Product {
  autoid: string
  id: string
  upc: string
  type: string
  descr_1: string
  descr_2: string
  base: string
  cost: string
  price: string
  old_price: string
  base_price: string
  base_old_price: string
  max_count: string
  location: string
  inactive: boolean
  ignoreCount: boolean
  product_specs: unknown[]
  units: unknown[]
  def_unit: string
  unit: string
  photo: string
  photos: unknown[]
  color: string
  configurations: unknown[]
}

export interface ConfigurationUnit {
  autoid: string
  id: string
  unit: string
  multiplier: string
  price: string
  old_price: string
}

export interface ConfigurationItem {
  id: string
  descr_1: string
  int_note: string
  def_unit: string
  c_type: string
  quan: string
  price: string
  old_price: string
  components: number
  active?: boolean
  isLoading?: boolean
  photo?: string
  photos?: string[]
}

export interface Configuration {
  name: string
  allownone: boolean
  default: string
  items: ConfigurationItem[]
  active?: boolean
  photosRequested?: boolean
  photosLoading?: boolean
}

export interface ConfigurationProduct {
  id: string
  autoid: string
  descr_1: string
  c_type: string
  cto_prompt: string
  ostk_msg: string
  super_id: string
  def_unit: string
  weight: string
  show_web: boolean
  markup_id: string
  configurations_count: number
  single_components: number
  max_count: number
  ignore_count: boolean
  price: string
  old_price: string
  base_price: string
  base_old_price: string
  units: ConfigurationUnit[]
  configurations: Configuration[]
}

export interface CartConfiguration {
  id: string
  name: string
  active: boolean
}

export interface CartItem {
  id: number
  product_autoid: string
  product_id: string
  name: string
  unit: string
  quantity: number
  price: number
  old_price: number
  amount: number
  max_count: number
  ignore_count: boolean
  photo: string
  photos: string[]
  configurations: CartConfiguration[]
  created_at: string
  updated_at: string
}

export interface Cart {
  total: number
  old_total: number
  items: CartItem[]
}

export type ProductResponse = PaginatedResponse<Product>

export interface ProductParams extends PaginationParams {
  search?: string
  ordering?: string
  inactive?: boolean
  type?: string
}
