import type { FileRoutesByTo } from '@/routeTree.gen'

// Explicitly-empty VITE_API_URL means same-origin: requests go to /api on the
// current host (the Vite dev proxy forwards them to the real backend).
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'https://api.ebms.app'
export const API_BASE_URL = `${API_ORIGIN}/api/`

export const DEFAULT_LIMIT = 20

export const AUTH_REDIRECTS = {
  signInSuccess: '/',
  logout: '/sign-in'
} satisfies Record<string, keyof FileRoutesByTo>
