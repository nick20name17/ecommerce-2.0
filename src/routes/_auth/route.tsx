import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod/mini'

import { AUTH_REDIRECTS } from '@/api/constants'
import { getSession } from '@/helpers/auth'

const AuthLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
  validateSearch: z.object({
    redirect: z.optional(z.string())
  }),
  beforeLoad: () => {
    const session = getSession()

    if (session?.user) {
      throw redirect({ to: AUTH_REDIRECTS.signInSuccess, replace: true })
    }
  }
})
