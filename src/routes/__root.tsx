import { HeadContent, Outlet, createRootRoute, retainSearchParams } from '@tanstack/react-router'
import { z } from 'zod'

import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/providers/auth'

const RootSearchParamsSchema = z.object({
  project_id: z.coerce.number().optional()
})

export type RootSearchParams = z.infer<typeof RootSearchParamsSchema>

const RootComponent = () => {
  return (
    <AuthProvider>
      <HeadContent />
      <Outlet />
      <Toaster
        duration={7000}
        richColors
      />
    </AuthProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): RootSearchParams => {
    const result = RootSearchParamsSchema.safeParse(search)
    return result.success ? result.data : {}
  },
  search: {
    middlewares: [retainSearchParams(['project_id'])]
  }
})
