import { AlertCircle, CornerDownLeft, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { productService } from '@/api/product/service'
import type { Product } from '@/api/product/schema'
import { getErrorMessage } from '@/helpers/error'
import { cn } from '@/lib/utils'

interface QuickAddInputProps {
  customerId: string
  projectId: number | null
  disabled?: boolean
  onProductFound: (product: Product) => void
}

export function QuickAddInput({
  customerId,
  projectId,
  disabled,
  onProductFound
}: QuickAddInputProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    const id = value.trim()
    if (!id || loading || disabled) return

    setLoading(true)
    setError(null)

    try {
      const res = await productService.get({
        search: id,
        limit: 5,
        customer_id: customerId,
        project_id: projectId ?? undefined
      })

      // Try exact match first, then first result
      const exact = res.results.find(
        (p) => p.id.toLowerCase() === id.toLowerCase()
      )
      const product = exact ?? res.results[0]

      if (!product) {
        setError(`No product found for "${id}"`)
        return
      }

      onProductFound(product)
      setValue('')
      setError(null)
      // Keep focus for rapid entry
      queueMicrotask(() => inputRef.current?.focus())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col gap-1'>
      <div
        className={cn(
          'flex h-9 items-center gap-2 rounded-[6px] border bg-background px-3 transition-[border-color,box-shadow] duration-[80ms]',
          error
            ? 'border-destructive/50 focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20'
            : 'border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={inputRef}
          type='text'
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase())
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder='Type product ID and press Enter…'
          disabled={disabled || loading}
          className='flex-1 bg-transparent text-[13px] font-medium uppercase outline-none placeholder:font-normal placeholder:normal-case placeholder:text-text-tertiary disabled:cursor-not-allowed'
          autoComplete='off'
          spellCheck={false}
        />
        {loading ? (
          <Loader2 className='size-3.5 shrink-0 animate-spin text-text-tertiary' />
        ) : value.trim() ? (
          <button
            type='button'
            className='flex shrink-0 items-center gap-1 rounded-[4px] bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary transition-colors duration-75 hover:bg-bg-active hover:text-foreground'
            onClick={handleSubmit}
            tabIndex={-1}
          >
            <CornerDownLeft className='size-3' />
            Add
          </button>
        ) : (
          <kbd className='shrink-0 rounded-[4px] border border-border bg-bg-secondary px-1.5 py-0.5 text-[11px] text-text-quaternary'>
            Enter
          </kbd>
        )}
      </div>
      {error && (
        <div className='flex items-center gap-1.5 text-[12px] text-destructive'>
          <AlertCircle className='size-3 shrink-0' />
          {error}
        </div>
      )}
    </div>
  )
}
