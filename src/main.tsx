import { disableReactDevTools } from '@fvilers/disable-react-devtools'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'

import '@/index.css'
import { Providers } from '@/providers'
import { routeTree } from '@/routeTree.gen'

if (import.meta.env.PROD) {
  disableReactDevTools()
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
