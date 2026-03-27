export const PICK_LIST_STATUS = {
  draft: 'draft',
  partiallyFailed: 'partially_failed',
  pushed: 'pushed',
  ratesFetched: 'rates_fetched',
  labelPurchased: 'label_purchased',
} as const

export type PickListStatus = (typeof PICK_LIST_STATUS)[keyof typeof PICK_LIST_STATUS]

export const PICK_LIST_STATUS_LABELS: Record<PickListStatus, string> = {
  [PICK_LIST_STATUS.draft]: 'Draft',
  [PICK_LIST_STATUS.partiallyFailed]: 'Partially Failed',
  [PICK_LIST_STATUS.pushed]: 'Pushed to EBMS',
  [PICK_LIST_STATUS.ratesFetched]: 'Rates Fetched',
  [PICK_LIST_STATUS.labelPurchased]: 'Label Purchased',
}

export const PICK_LIST_STATUS_CLASS: Record<PickListStatus, string> = {
  [PICK_LIST_STATUS.draft]:
    'border-slate-300 bg-slate-500/10 text-slate-800 dark:border-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
  [PICK_LIST_STATUS.partiallyFailed]:
    'border-red-300 bg-red-500/10 text-red-800 dark:border-red-600 dark:bg-red-500/20 dark:text-red-300',
  [PICK_LIST_STATUS.pushed]:
    'border-blue-300 bg-blue-500/10 text-blue-800 dark:border-blue-600 dark:bg-blue-500/20 dark:text-blue-300',
  [PICK_LIST_STATUS.ratesFetched]:
    'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
  [PICK_LIST_STATUS.labelPurchased]:
    'border-green-300 bg-green-500/10 text-green-800 dark:border-green-600 dark:bg-green-500/20 dark:text-green-300',
}

export const getPickListStatusLabel = (status: PickListStatus): string =>
  PICK_LIST_STATUS_LABELS[status] ?? status
