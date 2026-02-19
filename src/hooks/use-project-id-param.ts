import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useProjectIdParam() {
  const { project_id } = useSearch({ from: '__root__' })
  const navigate = useNavigate()

  const setProjectId = useCallback(
    (id: number | null) => {
      navigate({
        to: '.',
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          project_id: id ?? undefined
        }),
        replace: true
      })
    },
    [navigate]
  )

  return [project_id ?? null, setProjectId] as const
}
