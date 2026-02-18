import { api } from '..'

import type { PayloadLogListResponse, PayloadLogParams } from './schema'

export const payloadLogService = {
  get: async (params: PayloadLogParams) => {
    const { data } = await api.get<PayloadLogListResponse>('/projects/payload-logs/', { params })
    return data
  }
}

