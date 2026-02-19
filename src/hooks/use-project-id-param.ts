import { useNavigate, useSearch } from '@tanstack/react-router'

export function useProjectIdParam() {
  const { project_id } = useSearch({ from: '__root__' })
  const navigate = useNavigate()

  const setProjectId = (id: number | null) => {
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
  }

  return [project_id ?? null, setProjectId] as const
}
