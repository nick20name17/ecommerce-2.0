export const PAGINATION = {
  small: 10,
  default: 20,
  medium: 25,
  large: 50,
  max: 100
} as const

export const DEBOUNCE_MS = {
  searchShort: 300,
  searchDefault: 400,
  searchLong: 500,
  inputDefault: 300,
  resize: 150
} as const

export const TOAST_DURATION_MS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000
} as const

export const TEXT_TRUNCATE_LENGTH = {
  short: 20,
  default: 40,
  medium: 60,
  long: 100
} as const

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

export const VALIDATION_LIMITS = {
  passwordMinLength: 8,
  passwordMaxLength: 128,
  emailMaxLength: 255,
  nameMinLength: 1,
  nameMaxLength: 100,
  searchMinLength: 2
} as const

