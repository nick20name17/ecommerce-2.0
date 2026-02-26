import { api } from '..'

import type { CreateUserPayload, UpdateUserPayload, User, UserParams, UserResponse } from './schema'

export const userService = {
  get: async (params: UserParams) => {
    const { data } = await api.get<UserResponse>('/users/', { params })

    return data
  },
  getMe: async () => {
    const { data } = await api.get<User>('/auth/me/')

    return data
  },
  create: async (payload: CreateUserPayload) => {
    const { data } = await api.post<User>('/users/', payload)

    return data
  },
  update: async ({ id, payload }: UpdateUserPayload) => {
    const { data } = await api.patch<User>(`/users/${id}/`, payload)

    return data
  },
  delete: async (id: number) => {
    await api.delete(`/users/${id}/`)
  }
}
