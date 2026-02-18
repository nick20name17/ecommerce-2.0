import type { FileRoutesByTo } from '@/routeTree.gen'

export const API_BASE_URL = 'https://api.store.rivne.app/api/'

export const AUTH_REDIRECTS = {
  signInSuccess: '/',
  logout: '/sign-in'
} satisfies Record<string, keyof FileRoutesByTo>
