export const ORDER_STATUS = {
  unprocessed: 'U',
  outstandingInvoice: 'O',
  paidInvoice: 'X'
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.unprocessed]: 'Unprocessed',
  [ORDER_STATUS.outstandingInvoice]: 'Outstanding',
  [ORDER_STATUS.paidInvoice]: 'Paid Invoice'
}

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  [ORDER_STATUS.unprocessed]:
    'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  [ORDER_STATUS.outstandingInvoice]:
    'border-blue-300 bg-blue-500/10 text-blue-800 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  [ORDER_STATUS.paidInvoice]:
    'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300'
}

export const getOrderStatusLabel = (status: OrderStatus): string =>
  ORDER_STATUS_LABELS[status] ?? status
