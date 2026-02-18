export const PAGINATION = {
  small: 10,
  default: 20,
  medium: 25,
  large: 50,
  max: 100,
} as const

export const DEBOUNCE_MS = {
  searchShort: 300,
  searchDefault: 400,
  searchLong: 500,
  inputDefault: 300,
  resize: 150,
} as const

export const TOAST_DURATION_MS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
} as const

export const TEXT_TRUNCATE_LENGTH = {
  short: 20,
  default: 40,
  medium: 60,
  long: 100,
} as const

export const LOCALE_DEFAULT = 'en-US'
export const CURRENCY_DEFAULT = 'USD'

export const DATE_FORMAT_OPTIONS = {
  display: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  full: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  short: {
    year: '2-digit' as const,
    month: 'numeric' as const,
    day: 'numeric' as const,
  },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>

export const VALIDATION_LIMITS = {
  passwordMinLength: 8,
  passwordMaxLength: 128,
  emailMaxLength: 255,
  nameMinLength: 1,
  nameMaxLength: 100,
  searchMinLength: 2,
} as const
