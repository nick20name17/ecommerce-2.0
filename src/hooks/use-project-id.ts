import { useLocalStorage } from 'usehooks-ts'

const PROJECT_ID_KEY = 'project_id'

export function useProjectId(): [number | null, (id: number | null) => void] {
  const [projectId, setProjectId] = useLocalStorage<number | null>(PROJECT_ID_KEY, null)
  return [projectId, setProjectId]
}
