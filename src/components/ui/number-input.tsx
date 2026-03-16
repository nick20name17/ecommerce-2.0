import { AlertCircle, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default'
  showMaxMessage?: boolean
  id?: string
  name?: string
}

const sizeClasses = {
  sm: 'size-7 text-sm w-10',
  default: 'size-8 text-base w-14'
} as const

export const NumberInput = ({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  className,
  size = 'default',
  showMaxMessage = false,
  id,
  name
}: NumberInputProps) => {
  const hasError = max !== undefined && (max <= 0 || value > max)
  const isDisabled = disabled || (max !== undefined && max <= 0)
  const s = sizeClasses[size]

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value into draft when not editing
  useEffect(() => {
    if (!editing) {
      setDraft(String(value))
    }
  }, [value, editing])

  const clamp = (n: number) => {
    let clamped = Math.max(min, n)
    if (max !== undefined) clamped = Math.min(max, clamped)
    return clamped
  }

  const commit = () => {
    setEditing(false)
    const n = parseInt(draft, 10)
    if (isNaN(n) || draft.trim() === '') {
      // Restore previous value
      setDraft(String(value))
      return
    }
    const clamped = clamp(n)
    if (clamped !== value) {
      onChange(clamped)
    }
    setDraft(String(clamped))
  }

  const handleFocus = () => {
    setEditing(true)
    setDraft(String(value))
    // Select all on focus so user can type a new number directly
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setDraft(String(value))
      inputRef.current?.blur()
    }
  }

  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(max !== undefined ? Math.min(max, value + step) : value + step)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        className={cn(
          'inline-flex items-center rounded-md border p-0.5',
          hasError ? 'border-destructive' : 'border-input',
          isDisabled && 'pointer-events-none opacity-60'
        )}
      >
        <button
          type='button'
          className={cn(
            'hover:bg-muted flex items-center justify-center rounded disabled:opacity-40',
            s
          )}
          disabled={isDisabled || value <= min}
          onClick={decrement}
          aria-label='Decrease'
        >
          <Minus className='size-3.5' />
        </button>
        <input
          ref={inputRef}
          type='text'
          inputMode='numeric'
          pattern='[0-9]*'
          id={id}
          name={name}
          className={cn(
            'border-0 bg-transparent text-center outline-none',
            size === 'sm' ? 'w-10 text-sm' : 'w-14'
          )}
          value={editing ? draft : String(value)}
          min={min}
          max={max}
          step={step}
          disabled={isDisabled}
          onChange={(e) => {
            // Allow only digits while typing
            const val = e.target.value.replace(/[^0-9]/g, '')
            setDraft(val)
          }}
          onFocus={handleFocus}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
        <button
          type='button'
          className={cn(
            'hover:bg-muted flex items-center justify-center rounded disabled:opacity-40',
            s
          )}
          disabled={isDisabled || (max !== undefined && value >= max)}
          onClick={increment}
          aria-label='Increase'
        >
          <Plus className='size-3.5' />
        </button>
      </div>
      {showMaxMessage && max !== undefined && (max <= 0 || value > max) ? (
        <span className='text-destructive flex items-center gap-1.5 text-xs'>
          <AlertCircle className='size-3.5 shrink-0' />
          Only {max} available
        </span>
      ) : null}
    </div>
  )
}
