import { api } from '..'

import type {
  PushStatusOverviewResponse,
  PushStatusParams,
  PushStatusResponse
} from './schema'

export const pushStatusService = {
  get: async (params: PushStatusParams) => {
    const { data } = await api.get<PushStatusResponse>('/data/proposals/push-status/', { params })
    return data
  },
  getOverview: async () => {
    const { data } = await api.get<PushStatusOverviewResponse>(
      '/data/proposals/push-status/overview/'
    )
    return data
  }
}
