import { useLocalStorage } from 'usehooks-ts'

import { STORAGE_KEYS } from '@/constants/storage'

export function useSelectedCustomerId(): [string | null, (id: string | null) => void] {
  const [customerId, setCustomerId] = useLocalStorage<string | null>(
    STORAGE_KEYS.selectedCustomerId,
    null
  )
  return [customerId, setCustomerId]
}
