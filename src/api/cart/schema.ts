import type { CartConfiguration } from '../product/schema'

export interface AddToCartPayload {
  product_autoid: string
  quantity: number
  unit: string
  configurations?: CartConfiguration[]
}

export interface UpdateCartItemPayload {
  quantity?: number
  configurations?: CartConfiguration[]
}

export interface SubmitOrderResponse {
  AUTOID: string
}

export interface SubmitProposalResponse {
  AUTOID: string
}
