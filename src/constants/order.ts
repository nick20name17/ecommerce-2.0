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

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status
}
