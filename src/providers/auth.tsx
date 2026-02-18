import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { type PropsWithChildren, createContext, useContext } from 'react'

import type { SignInPayload, SignInResponse } from '@/api/auth/schema'
import { authService } from '@/api/auth/service'
import { AUTH_REDIRECTS } from '@/api/constants'
import { USERS_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { userService } from '@/api/user/service'
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
  const { redirect } = useSearch({ strict: false })

  const router = useRouter()
  const queryClient = useQueryClient()

  const session = getSession()
  const userId = session?.user?.id ?? null

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: USERS_QUERY_KEYS.detail('me'),
    queryFn: userService.getMe,
    placeholderData: session?.user,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!userId
  })

  const logout = async () => {
    clearSession()

    queryClient.removeQueries({ queryKey: USERS_QUERY_KEYS.detail('me') })
    queryClient.clear()

    await navigate({ to: AUTH_REDIRECTS.logout, replace: true })
    router.invalidate()
  }

  const signInMutation = useMutation({
    mutationFn: authService.signIn,
    onSuccess: async (response) => {
      setSession(response)

      queryClient.setQueryData(USERS_QUERY_KEYS.detail('me'), response.user)

      await navigate({ to: redirect || AUTH_REDIRECTS.signInSuccess, replace: true })
      router.invalidate()
    }
  })

  const value = {
    user: user ?? null,
    signInMutation,
    logout,
    isUserLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
