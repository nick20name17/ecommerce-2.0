import { api } from '..'

import type { PushStatusParams, PushStatusResponse } from './schema'

export const pushStatusService = {
  get: async (params: PushStatusParams) => {
    const { data } = await api.get<PushStatusResponse>(
      '/data/proposals/push-status/',
      { params },
    )
    return data
  },
}
