import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import z from 'zod'

import { AUTH_REDIRECTS } from '@/api/constants'
import { getSession } from '@/helpers/auth'

const AuthLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
  validateSearch: z.object({
    redirect: z.string().optional()
  }),
  beforeLoad: () => {
    const session = getSession()

    if (session?.user) {
      throw redirect({ to: AUTH_REDIRECTS.signInSuccess, replace: true })
    }
  }
})
