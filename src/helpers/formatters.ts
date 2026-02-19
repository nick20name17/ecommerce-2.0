import { format } from 'date-fns'

import {
  CURRENCY_DEFAULT,
  DATE_FORMATS,
  LOCALE_DEFAULT,
  TEXT_TRUNCATE_LENGTH
} from '@/constants/app'

const currencyFormat = new Intl.NumberFormat(LOCALE_DEFAULT, {
  style: 'currency',
  currency: CURRENCY_DEFAULT
})

export function formatCurrency(
  amount: string | number | null | undefined,
  fallback: string = '$0.00'
): string {
  if (amount === undefined || amount === null || amount === '') return fallback
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return fallback
  try {
    return currencyFormat.format(num)
  } catch {
    return fallback
  }
}

export function formatQuantity(
  quantity: string | number | null | undefined,
  decimals: number = 2,
  fallback: string = '—'
): string {
  if (!quantity && quantity !== 0) return fallback
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity
  if (isNaN(num)) return fallback
  try {
    return new Intl.NumberFormat(LOCALE_DEFAULT, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(num)
  } catch {
    return fallback
  }
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return (
    new Intl.NumberFormat(LOCALE_DEFAULT, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value * 100) + '%'
  )
}

export function formatDate(
  value: Date | string | null | undefined,
  formatKey: keyof typeof DATE_FORMATS = 'display'
): string {
  if (value === null || value === undefined) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return format(date, DATE_FORMATS[formatKey])
}

export function truncateText(
  text: string | null | undefined,
  maxLength: number = TEXT_TRUNCATE_LENGTH.default
): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function formatResponseTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}
