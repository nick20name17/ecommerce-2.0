export const ORDER_STATUS = {
  unprocessed: 'U',
  open: 'O',
  closed: 'X',
  paid: 'P',
  voided: 'V',
  onHold: 'H',
  adjusted: 'A',
} as const

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [ORDER_STATUS.unprocessed]: 'Unprocessed',
  [ORDER_STATUS.open]: 'Open',
  [ORDER_STATUS.closed]: 'Closed',
  [ORDER_STATUS.paid]: 'Paid',
  [ORDER_STATUS.voided]: 'Voided',
  [ORDER_STATUS.onHold]: 'On Hold',
  [ORDER_STATUS.adjusted]: 'Adjusted',
}

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  [ORDER_STATUS.unprocessed]:
    'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  [ORDER_STATUS.open]:
    'border-blue-300 bg-blue-500/10 text-blue-800 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  [ORDER_STATUS.closed]:
    'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300',
  [ORDER_STATUS.paid]:
    'border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
  [ORDER_STATUS.voided]:
    'border-red-300 bg-red-500/10 text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300',
  [ORDER_STATUS.onHold]:
    'border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  [ORDER_STATUS.adjusted]:
    'border-border bg-muted text-muted-foreground',
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status
}
