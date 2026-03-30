import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { parseAsString, useQueryState } from 'nuqs'
import { type PropsWithChildren, createContext, useContext, useMemo } from 'react'

import type { SignInPayload, SignInResponse } from '@/api/auth/schema'
import { authService } from '@/api/auth/service'
import { AUTH_REDIRECTS } from '@/api/constants'
import { USER_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { STORAGE_KEYS } from '@/constants/storage'
import { clearSession, getSession, setSession } from '@/helpers/auth'

interface AuthContextValue {
  user: User | null
  isUserLoading: boolean
  signInMutation: UseMutationResult<SignInResponse, Error, SignInPayload, unknown>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
  const [redirect] = useQueryState('redirect', parseAsString)

  const router = useRouter()
  const queryClient = useQueryClient()

  const session = getSession()
  const userId = session?.user?.id ?? null

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: USER_QUERY_KEYS.detail('me'),
    queryFn: userService.getMe,
    placeholderData: session?.user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!userId
  })

  const logout = async () => {
    clearSession()
    localStorage.removeItem(STORAGE_KEYS.projectId)
    localStorage.removeItem(STORAGE_KEYS.projectName)

    await navigate({ to: AUTH_REDIRECTS.logout, replace: true })

    router.invalidate()
    queryClient.clear()
  }

  const signInMutation = useMutation({
    mutationFn: authService.signIn,
    onSuccess: async (response) => {
      setSession(response)

      if (response.user.project_id) {
        localStorage.setItem(STORAGE_KEYS.projectId, JSON.stringify(response.user.project_id))
      } else {
        localStorage.removeItem(STORAGE_KEYS.projectId)
      }

      if (response.user.project_name) {
        localStorage.setItem(STORAGE_KEYS.projectName, JSON.stringify(response.user.project_name))
      } else {
        localStorage.removeItem(STORAGE_KEYS.projectName)
      }

      queryClient.setQueryData(USER_QUERY_KEYS.detail('me'), response.user)

      const isValidRedirect =
        typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')

      await navigate({
        to: isValidRedirect ? redirect : AUTH_REDIRECTS.signInSuccess,
        replace: true
      })
      router.invalidate()
    }
  })

  const value = useMemo(
    () => ({
      user: user ?? null,
      signInMutation,
      logout,
      isUserLoading
    }),
    [user, signInMutation, logout, isUserLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
