import { NuqsAdapter } from '@/adapters/nuqs-tanstack-router'
import type { PropsWithChildren } from 'react'

import { ReactQueryProvider } from './react-query'
import { ThemeProvider } from './theme'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <NuqsAdapter>
      <ReactQueryProvider>
        <TooltipProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </TooltipProvider>
      </ReactQueryProvider>
    </NuqsAdapter>
  )
}
