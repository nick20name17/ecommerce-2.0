import { useLocalStorage } from 'usehooks-ts'

import { STORAGE_KEYS } from '@/constants/storage'

export function useProjectId(): [number | null, (id: number | null) => void] {
  const [projectId, setProjectId] = useLocalStorage<number | null>(
    STORAGE_KEYS.projectId,
    null
  )
  return [projectId, setProjectId]
}
