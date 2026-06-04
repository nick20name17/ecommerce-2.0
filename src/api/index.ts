import { type InternalAxiosRequestConfig } from 'axios'

import { api } from './client'
import { AUTH_REDIRECTS } from './constants'
import { refreshAccessToken } from './helpers'
import { clearSession, getSession } from '@/helpers/auth'

export { api }

api.interceptors.request.use(
  config => {
    const session = getSession()

    if (session?.access) {
      config.headers.Authorization = `Bearer ${session.access}`
    }

    return config
  },
  error => Promise.reject(error)
)

const isRefreshRequest = (config: InternalAxiosRequestConfig) =>
  String(config?.url ?? '').includes('/auth/refresh')

api.interceptors.response.use(
  response => response,
  async error => {
    const config = error?.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error?.response?.status === 401 && isRefreshRequest(config)) {
      clearSession()
      window.location.href = AUTH_REDIRECTS.logout
      return Promise.reject(error)
    }

    const session = getSession()
    if (!session?.refresh) return Promise.reject(error)

    if (error?.response?.status !== 401 || config?._retry) {
      return Promise.reject(error)
    }

    config._retry = true

    try {
      const { access } = await refreshAccessToken()
      config.headers.Authorization = `Bearer ${access}`

      return api(config)
    } catch (refreshError) {
      clearSession()
      window.location.href = AUTH_REDIRECTS.logout
      return Promise.reject(refreshError)
    }
  }
)
