import { useLocalStorage } from 'usehooks-ts'

import { STORAGE_KEYS } from '@/constants/storage'

/**
 * Persists the currently-selected customer ID for the create-order/proposal
 * flow. Storage is per-project: a customer ID picked in project A stays
 * remembered when the superadmin switches to project B and back. Without
 * scoping, switching project would replay project A's customer ID against
 * project B and 404.
 */
export const useSelectedCustomerId = (
  projectId: number | null | undefined
): [string | null, (id: string | null) => void] => {
  const key =
    projectId == null
      ? STORAGE_KEYS.selectedCustomerId
      : `${STORAGE_KEYS.selectedCustomerId}:${projectId}`
  const [customerId, setCustomerId] = useLocalStorage<string | null>(key, null)
  return [customerId, setCustomerId]
}
