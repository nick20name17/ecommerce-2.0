import type { FileRoutesByTo } from '@/routeTree.gen'

export const API_ORIGIN = 'https://api.store.rivne.app'
export const API_BASE_URL = `${API_ORIGIN}/api/`

export const DEFAULT_LIMIT = 20

export const AUTH_REDIRECTS = {
  signInSuccess: '/',
  logout: '/sign-in'
} satisfies Record<string, keyof FileRoutesByTo>
