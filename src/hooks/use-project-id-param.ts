import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'

export function useProjectIdParam() {
  const { project_id } = useSearch({ from: '__root__' })
  const navigate = useNavigate()

  const setProjectId = useCallback(
    (id: number | null) => {
      const nextId = id ?? undefined
      navigate({
        to: '.',
        search: (prev: Record<string, unknown>) => {
          const prevId = prev?.project_id
          if (prevId === nextId || (prevId == null && nextId == null)) return prev
          return { ...prev, project_id: nextId }
        },
        replace: true
      })
    },
    [navigate]
  )

  return [project_id ?? null, setProjectId] as const
}
