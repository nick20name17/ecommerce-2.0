import { describe, expect, it } from 'vitest'

import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatDateMedium,
  formatDateShort,
  formatPhone,
  getInitials,
  getInitialsFromParts,
  getUserDisplayName
} from './formatters'

// ── getInitials ─────────────────────────────────────────────

describe('getInitials', () => {
  it('returns initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('handles undefined by throwing', () => {
    expect(() => getInitials(undefined as unknown as string)).toThrow()
  })

  it('takes only first two words for three-word names', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('uppercases lowercase initials', () => {
    expect(getInitials('jane doe')).toBe('JD')
  })

  it('handles extra whitespace', () => {
    expect(getInitials('  Jane   Doe  ')).toBe('JD')
  })
})

// ── getInitialsFromParts ────────────────────────────────────

describe('getInitialsFromParts', () => {
  it('returns initials from first and last name', () => {
    expect(getInitialsFromParts('John', 'Doe')).toBe('JD')
  })

  it('falls back to email', () => {
    expect(getInitialsFromParts('', '', 'john@example.com')).toBe('J')
  })

  it('returns fallback for no input', () => {
    expect(getInitialsFromParts()).toBe('?')
  })

  it('returns first name initial when only first name given', () => {
    expect(getInitialsFromParts('Alice')).toBe('A')
  })

  it('returns last name initial when only last name given', () => {
    expect(getInitialsFromParts('', 'Smith')).toBe('S')
  })

  it('handles whitespace-only names gracefully', () => {
    expect(getInitialsFromParts('  ', '  ', 'z@example.com')).toBe('Z')
  })

  it('returns ? when email is also undefined', () => {
    expect(getInitialsFromParts(undefined, undefined, undefined)).toBe('?')
  })

  it('uppercases lowercase initials', () => {
    expect(getInitialsFromParts('jane', 'doe')).toBe('JD')
  })
})

// ── formatCurrency ──────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats a positive integer', () => {
    expect(formatCurrency(100)).toBe('$100.00')
  })

  it('formats a decimal number', () => {
    expect(formatCurrency(49.99)).toBe('$49.99')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative values', () => {
    expect(formatCurrency(-25.5)).toBe('-$25.50')
  })

  it('formats a string number', () => {
    expect(formatCurrency('1234.56')).toBe('$1,234.56')
  })

  it('returns fallback for null', () => {
    expect(formatCurrency(null)).toBe('$0.00')
  })

  it('returns fallback for undefined', () => {
    expect(formatCurrency(undefined)).toBe('$0.00')
  })

  it('returns fallback for empty string', () => {
    expect(formatCurrency('')).toBe('$0.00')
  })

  it('returns fallback for non-numeric string', () => {
    expect(formatCurrency('abc')).toBe('$0.00')
  })

  it('returns custom fallback when provided', () => {
    expect(formatCurrency(null, 'N/A')).toBe('N/A')
  })

  it('respects maximumFractionDigits option', () => {
    expect(formatCurrency(10.999, '$0.00', { maximumFractionDigits: 0 })).toBe('$11')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })
})

// ── formatDate ──────────────────────────────────────────────

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('formats a Date object with default display format', () => {
    const date = new Date(2026, 2, 28) // March 28, 2026 (month is 0-indexed)
    expect(formatDate(date)).toBe('Mar 28, 2026')
  })

  it('formats a YYYY-MM-DD string as local date', () => {
    const result = formatDate('2026-01-15')
    expect(result).toBe('Jan 15, 2026')
  })

  it('formats an ISO datetime string', () => {
    const result = formatDate('2026-06-01T10:30:00Z')
    expect(result).toContain('2026')
  })

  it('formats with dateTime format key', () => {
    const date = new Date(2026, 0, 1, 14, 30)
    const result = formatDate(date, 'dateTime')
    expect(result).toContain('2:30 PM')
  })
})

// ── formatDateShort / formatDateMedium ──────────────────────

describe('formatDateShort', () => {
  it('formats date as short string', () => {
    const result = formatDateShort('2026-03-28T12:00:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('28')
  })

  it('omits the year', () => {
    const result = formatDateShort('2026-12-25T00:00:00Z')
    expect(result).not.toContain('2026')
  })
})

describe('formatDateMedium', () => {
  it('includes month, day, and year', () => {
    const result = formatDateMedium('2026-07-04T12:00:00Z')
    expect(result).toContain('Jul')
    expect(result).toContain('4')
    expect(result).toContain('2026')
  })
})

// ── formatPhone ─────────────────────────────────────────────

describe('formatPhone', () => {
  it('returns empty string for null', () => {
    expect(formatPhone(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatPhone(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatPhone('')).toBe('')
  })

  it('formats a 10-digit number', () => {
    expect(formatPhone('5551234567')).toBe('(555) 123-4567')
  })

  it('formats a 10-digit number with existing formatting', () => {
    expect(formatPhone('555-123-4567')).toBe('(555) 123-4567')
  })

  it('formats an 11-digit number starting with 1', () => {
    expect(formatPhone('15551234567')).toBe('+1 (555) 123-4567')
  })

  it('returns original for other lengths', () => {
    expect(formatPhone('12345')).toBe('12345')
  })

  it('returns original for international numbers', () => {
    expect(formatPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958')
  })
})

// ── formatBytes ─────────────────────────────────────────────

describe('formatBytes', () => {
  it('returns 0 Bytes for zero', () => {
    expect(formatBytes(0)).toBe('0 Bytes')
  })

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 Bytes')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })

  it('formats with decimals', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB')
  })

  it('respects custom decimal count', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB')
  })
})

// ── getUserDisplayName ──────────────────────────────────────

describe('getUserDisplayName', () => {
  it('returns full_name when available', () => {
    expect(getUserDisplayName({ full_name: 'Jane Smith' })).toBe('Jane Smith')
  })

  it('builds name from first and last when full_name is empty', () => {
    expect(getUserDisplayName({ first_name: 'Jane', last_name: 'Smith' })).toBe('Jane Smith')
  })

  it('returns first name only when last is missing', () => {
    expect(getUserDisplayName({ first_name: 'Jane' })).toBe('Jane')
  })

  it('returns email when no names are available', () => {
    expect(getUserDisplayName({ email: 'jane@example.com' })).toBe('jane@example.com')
  })

  it('returns default fallback for null user', () => {
    expect(getUserDisplayName(null)).toBe('—')
  })

  it('returns default fallback for undefined user', () => {
    expect(getUserDisplayName(undefined)).toBe('—')
  })

  it('returns custom fallback', () => {
    expect(getUserDisplayName(null, 'Unknown')).toBe('Unknown')
  })

  it('returns fallback when all fields are empty strings', () => {
    expect(getUserDisplayName({ first_name: '', last_name: '', email: '', full_name: '' })).toBe(
      '—'
    )
  })

  it('trims whitespace from full_name', () => {
    expect(getUserDisplayName({ full_name: '  Jane Smith  ' })).toBe('Jane Smith')
  })

  it('prefers full_name over first/last', () => {
    expect(
      getUserDisplayName({ full_name: 'Dr. Jane', first_name: 'Jane', last_name: 'Smith' })
    ).toBe('Dr. Jane')
  })
})
