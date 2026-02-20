import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/providers/auth'

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
  component: RootComponent
})
