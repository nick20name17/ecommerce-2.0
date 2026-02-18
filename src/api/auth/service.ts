import { api } from '..'

import type { RefreshPayload, RefreshResponse, SignInPayload, SignInResponse } from './schema'

export const authService = {
  signIn: async (payload: SignInPayload) => {
    const { data } = await api.post<SignInResponse>('/auth/login/', payload)
    return data
  },
  refresh: async (payload: RefreshPayload) => {
    const { data } = await api.post<RefreshResponse>('/auth/refresh/', payload)
    return data
  }
}
