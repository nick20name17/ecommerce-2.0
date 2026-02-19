import axios, { type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL, AUTH_REDIRECTS } from './constants'
import { memoizedRefreshToken } from './helpers'
import { clearSession, getSession } from '@/helpers/auth'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const session = getSession()

    if (session?.access) {
      config.headers.Authorization = `Bearer ${session.access}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

const isRefreshRequest = (config: InternalAxiosRequestConfig) =>
  String(config?.url ?? '').includes('/auth/refresh')

api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
      const { access } = await memoizedRefreshToken()
      config.headers.Authorization = `Bearer ${access}`

      return api(config)
    } catch (refreshError) {
      clearSession()
      window.location.href = AUTH_REDIRECTS.logout
      return Promise.reject(refreshError)
    }
  }
)
