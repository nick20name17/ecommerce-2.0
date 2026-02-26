export const CUSTOMER_TABS = [
  { value: 'orders', label: 'Orders' },
  { value: 'todos', label: "To-Do's" },
  { value: 'dashboard', label: 'Dashboard' }
] as const

export const CUSTOMER_TAB_VALUES = CUSTOMER_TABS.map((t) => t.value) as [string, ...string[]]

export const CUSTOMER_TYPES = {
  retail: 'R',
  wholesale: 'W',
  distributor: 'D',
  other: 'O',
} as const

export type CustomerType = (typeof CUSTOMER_TYPES)[keyof typeof CUSTOMER_TYPES]

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  [CUSTOMER_TYPES.retail]: 'Retail',
  [CUSTOMER_TYPES.wholesale]: 'Wholesale',
  [CUSTOMER_TYPES.distributor]: 'Distributor',
  [CUSTOMER_TYPES.other]: 'Other',
}

export const CUSTOMER_TYPE_OPTIONS = (Object.entries(CUSTOMER_TYPE_LABELS) as [CustomerType, string][]).map(
  ([value, label]) => ({ value, label })
)

export function getCustomerTypeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return CUSTOMER_TYPE_LABELS[type as CustomerType] ?? type
}
