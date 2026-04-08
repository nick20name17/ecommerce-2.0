import type { OrderStatus } from '@/constants/order'
import { ORDER_STATUS } from '@/constants/order'

export const STATUS_DOT_COLORS: Record<string, string> = {
  U: 'bg-amber-500',
  O: 'bg-blue-500',
  X: 'bg-emerald-500'
}

export type OrderSortField = 'invoice' | 'name' | 'inv_date' | 'total' | 'balance'
export type SortDir = 'asc' | 'desc'

export const FILTER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: ORDER_STATUS.unprocessed, label: 'Unprocessed' },
  { value: ORDER_STATUS.outstandingInvoice, label: 'Outstanding' },
  { value: ORDER_STATUS.paidInvoice, label: 'Paid Invoice' }
]
