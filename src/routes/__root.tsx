import { HeadContent, Outlet, createRootRoute, retainSearchParams } from '@tanstack/react-router'
import { z } from 'zod'

import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/providers/auth'

const RootSearchParamsSchema = z.object({
  project_id: z.coerce.number().optional(),
  status: z.string().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
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
  validateSearch: (search: Record<string, unknown>): RootSearchParams & Record<string, unknown> => {
    const result = RootSearchParamsSchema.safeParse(search)
    const known = result.success ? result.data : {}
    const rest: Record<string, unknown> = {}
    for (const key of Object.keys(search)) {
      if (!(key in RootSearchParamsSchema.shape)) rest[key] = search[key]
    }
    return { ...rest, ...known }
  },
  search: {
    middlewares: [retainSearchParams(['project_id'])]
  }
})
