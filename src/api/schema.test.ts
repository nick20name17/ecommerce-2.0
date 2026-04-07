import { describe, expect, it } from 'vitest'
import * as z from 'zod/mini'

import {
  EmailSchema,
  NameSchema,
  NewPasswordSchema,
  PasswordSchema,
  RequiredStringSchema
} from './schema'

/** Helper: returns true if parsing succeeds */
function isValid(schema: z.ZodMiniType, value: unknown): boolean {
  const result = z.safeParse(schema, value)
  return result.success
}

/** Helper: returns first error message from a failed parse */
function firstError(schema: z.ZodMiniType, value: unknown): string {
  const result = z.safeParse(schema, value)
  if (!result.success) {
    return result.error.issues[0]?.message ?? ''
  }
  return ''
}

// ── RequiredStringSchema ────────────────────────────────────

describe('RequiredStringSchema', () => {
  it('accepts a non-empty string', () => {
    expect(isValid(RequiredStringSchema, 'hello')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValid(RequiredStringSchema, '')).toBe(false)
  })

  it('rejects a number', () => {
    expect(isValid(RequiredStringSchema, 42)).toBe(false)
  })

  it('rejects null', () => {
    expect(isValid(RequiredStringSchema, null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isValid(RequiredStringSchema, undefined)).toBe(false)
  })

  it('returns "required" message for empty string', () => {
    expect(firstError(RequiredStringSchema, '')).toBe('required')
  })
})

// ── PasswordSchema ──────────────────────────────────────────

describe('PasswordSchema', () => {
  it('accepts a short password (no complexity rules)', () => {
    expect(isValid(PasswordSchema, 'abc')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValid(PasswordSchema, '')).toBe(false)
  })

  it('rejects a string exceeding 64 characters', () => {
    const longPassword = 'a'.repeat(65)
    expect(isValid(PasswordSchema, longPassword)).toBe(false)
    expect(firstError(PasswordSchema, longPassword)).toBe('max 64 characters')
  })

  it('accepts a 64-character string', () => {
    expect(isValid(PasswordSchema, 'a'.repeat(64))).toBe(true)
  })
})

// ── NewPasswordSchema ───────────────────────────────────────

describe('NewPasswordSchema', () => {
  it('accepts a valid password with uppercase and number', () => {
    expect(isValid(NewPasswordSchema, 'Abcdef1!')).toBe(true)
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(isValid(NewPasswordSchema, 'Ab1')).toBe(false)
    expect(firstError(NewPasswordSchema, 'Ab1')).toBe('min 8 characters')
  })

  it('rejects a password without an uppercase letter', () => {
    expect(isValid(NewPasswordSchema, 'abcdefg1')).toBe(false)
    expect(firstError(NewPasswordSchema, 'abcdefg1')).toBe('must contain an uppercase letter')
  })

  it('rejects a password without a number', () => {
    expect(isValid(NewPasswordSchema, 'Abcdefgh')).toBe(false)
    expect(firstError(NewPasswordSchema, 'Abcdefgh')).toBe('must contain a number')
  })

  it('rejects an empty string', () => {
    expect(isValid(NewPasswordSchema, '')).toBe(false)
  })

  it('rejects a password exceeding 64 characters', () => {
    const longPassword = 'A1' + 'a'.repeat(63)
    expect(isValid(NewPasswordSchema, longPassword)).toBe(false)
  })

  it('accepts exactly 8 characters with uppercase and number', () => {
    expect(isValid(NewPasswordSchema, 'Abcdefg1')).toBe(true)
  })
})

// ── EmailSchema ─────────────────────────────────────────────

describe('EmailSchema', () => {
  it('accepts a valid email', () => {
    expect(isValid(EmailSchema, 'user@example.com')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValid(EmailSchema, '')).toBe(false)
  })

  it('rejects a string without @', () => {
    expect(isValid(EmailSchema, 'notanemail')).toBe(false)
  })

  it('rejects a string without domain', () => {
    expect(isValid(EmailSchema, 'user@')).toBe(false)
  })

  it('returns invalid email message', () => {
    expect(firstError(EmailSchema, 'bad')).toBe('invalid email')
  })

  it('accepts email with subdomain', () => {
    expect(isValid(EmailSchema, 'user@mail.example.co.uk')).toBe(true)
  })
})

// ── NameSchema ──────────────────────────────────────────────

describe('NameSchema', () => {
  it('accepts a normal name', () => {
    expect(isValid(NameSchema, 'Alice')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValid(NameSchema, '')).toBe(false)
  })

  it('rejects a string exceeding 64 characters', () => {
    expect(isValid(NameSchema, 'A'.repeat(65))).toBe(false)
  })

  it('accepts exactly 64 characters', () => {
    expect(isValid(NameSchema, 'A'.repeat(64))).toBe(true)
  })
})
