import { useLocation, useNavigate } from '@tanstack/react-router'
import { unstable_createAdapterProvider } from 'nuqs/adapters/custom'
import { startTransition, useCallback, useMemo } from 'react'

function urlSearchParamsToRecord(params: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {}
  params.forEach((value, key) => {
    record[key] = value
  })
  return record
}

function useNuqsTanstackRouterAdapterMerge(_watchKeys: string[]) {
  const { pathname, search: searchState } = useLocation()
  const search = (searchState ?? {}) as Record<string, unknown>
  const navigate = useNavigate()

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        Object.entries(search).flatMap(([key, value]) => {
          if (Array.isArray(value)) return value.map((v: unknown) => [key, String(v)])
          if (typeof value === 'object' && value !== null) return [[key, JSON.stringify(value)]]
          return [[key, String(value)]]
        })
      ),
    [search]
  )

  const updateUrl = useCallback(
    (nextParams: URLSearchParams, options: { history: 'replace' | 'push'; scroll: boolean }) => {
      startTransition(() => {
        const nuqsRecord = urlSearchParamsToRecord(nextParams)
        navigate({
          from: '/',
          to: pathname,
          search: (prev: Record<string, unknown>) => ({ ...prev, ...nuqsRecord }),
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          hash: (prevHash) => prevHash ?? '',
          state: (s) => s
        })
      })
    },
    [navigate, pathname]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1
  }
}

export const NuqsAdapter = unstable_createAdapterProvider(useNuqsTanstackRouterAdapterMerge)

