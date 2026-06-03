export const LOCALE_DEFAULT = 'en-US'
export const CURRENCY_DEFAULT = 'USD'

/** date-fns format strings — use with format(date, DATE_FORMATS.…) */
export const DATE_FORMATS = {
  /** Date only, e.g. "Apr 29, 2024" */
  display: 'MMM d, yyyy',
  /** Date and time (no seconds), e.g. "29.04.2024, 2:30 PM" */
  dateTime: 'dd.MM.yyyy, h:mm a',
  /** Long date for picker button, e.g. "April 29th, 2024" */
  datePicker: 'PPP',
  /** Time only (no seconds), e.g. "2:30 PM" */
  time: 'h:mm a'
} as const
