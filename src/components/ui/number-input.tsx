import { AlertCircle, Minus, Plus } from 'lucide-react'

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

export function NumberInput({
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
}: NumberInputProps) {
  const hasError = max !== undefined && (max <= 0 || value > max)
  const isDisabled = disabled || (max !== undefined && max <= 0)
  const s = sizeClasses[size]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n) && n >= min) onChange(max !== undefined ? Math.min(max, n) : n)
  }

  const handleBlur = () => {
    const clamped = Math.max(min, max !== undefined ? Math.min(max, value) : value)
    if (value !== clamped) onChange(clamped)
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
          type='number'
          id={id}
          name={name}
          className={cn(
            '[appearance:textfield] border-0 bg-transparent text-center outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
            size === 'sm' ? 'w-10 text-sm' : 'w-14'
          )}
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={isDisabled}
          onChange={handleInputChange}
          onBlur={handleBlur}
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
      {showMaxMessage && max !== undefined && (max <= 0 || value > max) && (
        <span className='text-destructive flex items-center gap-1.5 text-xs'>
          <AlertCircle className='size-3.5 shrink-0' />
          Only {max} available
        </span>
      )}
    </div>
  )
}

