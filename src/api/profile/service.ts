import { api } from '..'
import type { User } from '../user/schema'

import type { ChangePasswordPayload, UpdateProfilePayload } from './schema'

export const profileService = {
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch<User>('/auth/me/', payload)
    return data
  },
  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await api.post('/auth/change-password/', payload)
    return data
  },
  deactivateAccount: async (userId: number) => {
    const { data } = await api.patch<User>(`/users/${userId}/`, { is_active: false })
    return data
  },
  deleteAccount: async (userId: number) => {
    const { data } = await api.delete(`/users/${userId}/`)
    return data
  }
}
