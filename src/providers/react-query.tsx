import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey
} from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/helpers/error'

function getQueryResourceLabel(query: { queryKey: readonly unknown[] }): string {
  const key = query.queryKey
  const first = key[0]
  if (typeof first !== 'string') return 'Data'
  const label = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  return label
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      suppressErrorToast?: boolean
    }
    mutationMeta: {
      invalidatesQuery?: QueryKey
      successMessage?: string
      errorMessage?: string
    }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      if (query.meta?.suppressErrorToast) return
      const resource = getQueryResourceLabel(query)
      const message = getErrorMessage(error)
      toast.error(`Failed to fetch ${resource}`, {
        description: message
      })
    }
  }),
  mutationCache: new MutationCache({
    onError(error, _, __, mutation) {
      const errorMessage = getErrorMessage(error)
      toast.error(mutation.meta?.errorMessage ? mutation.meta.errorMessage : errorMessage)
    },
    onSuccess(_, __, ___, mutation) {
      const message = mutation.meta?.successMessage
      if (message) {
        toast.success(message)
      }
    },
    onSettled(_, __, ___, ____, mutation) {
      const queryKey = mutation.options.meta?.invalidatesQuery
      if (queryKey) {
        queryClient.invalidateQueries({ queryKey })
      }
    }
  }),
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 1000 * 60 * 5
    },
    mutations: {
      retry: 0
    }
  }
})

export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
