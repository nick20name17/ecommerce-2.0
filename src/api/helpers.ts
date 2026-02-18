import memoize from 'memoize'

import { authService } from '@/api/auth/service'
import { clearSession, getSession, updateTokens } from '@/helpers/auth'

const refreshToken = async () => {
  const session = getSession()

  if (!session?.refresh) {
    clearSession()
    throw new Error('No refresh token available')
  }

  try {
    const { access } = await authService.refresh({
      refresh: session.refresh
    })

    if (!access) {
      clearSession()
      throw new Error('No access token received')
    }

    updateTokens({ access })

    return { access }
  } catch (error) {
    clearSession()
    throw error
  }
}

export const memoizedRefreshToken = memoize(refreshToken, {
  maxAge: 10000
})
