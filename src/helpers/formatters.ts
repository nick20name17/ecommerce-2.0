import {
  CURRENCY_DEFAULT,
  LOCALE_DEFAULT,
  TEXT_TRUNCATE_LENGTH,
} from '@/constants/app'

export function formatCurrency(
  amount: string | number | null | undefined,
  currency: string = CURRENCY_DEFAULT,
  locale: string = LOCALE_DEFAULT,
  fallback: string = '$0.00'
): string {
  if (amount === undefined || amount === null || amount === '') {
    return fallback
  }

  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return fallback

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(num)
  } catch {
    return fallback
  }
}

export function formatQuantity(
  quantity: string | number | null | undefined,
  decimals: number = 2,
  locale: string = LOCALE_DEFAULT,
  fallback: string = '—'
): string {
  if (!quantity && quantity !== 0) return fallback

  try {
    const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity
    if (isNaN(num)) return fallback

    return num.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
  } catch {
    return fallback
  }
}

export function truncateText(
  text: string | null | undefined,
  maxLength: number = TEXT_TRUNCATE_LENGTH.default,
  ellipsis: string = '...'
): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + ellipsis
}

export function formatPercentage(
  value: number,
  decimals: number = 0,
  locale: string = LOCALE_DEFAULT
): string {
  return (
    (value * 100).toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + '%'
  )
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
