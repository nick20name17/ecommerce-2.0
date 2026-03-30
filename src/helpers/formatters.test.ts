import { describe, expect, it } from 'vitest'

import { formatDateShort, getInitials, getInitialsFromParts } from './formatters'

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
})

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
})

describe('formatDateShort', () => {
  it('formats date as short string', () => {
    const result = formatDateShort('2026-03-28T12:00:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('28')
  })
})
