import { useLocalStorage } from 'usehooks-ts'

const SELECTED_CUSTOMER_ID_KEY = 'selected_customer_id'

export function useSelectedCustomerId(): [string | null, (id: string | null) => void] {
  const [customerId, setCustomerId] = useLocalStorage<string | null>(SELECTED_CUSTOMER_ID_KEY, null)
  return [customerId, setCustomerId]
}
