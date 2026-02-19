import { Image, Minus, Pencil, Plus, Trash2 } from 'lucide-react'

import type { CartItem } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/helpers/formatters'

interface CartTableProps {
  items: CartItem[]
  loading: boolean
  updating: boolean
  onEdit: (item: CartItem) => void
  onRemove: (itemId: number) => void
  onQuantityChange: (itemId: number, quantity: number) => void
}

export function CartTable({ items, loading, updating, onEdit, onRemove, onQuantityChange }: CartTableProps) {
  if (loading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-14 w-full' />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10'>
        <Image className='size-8 opacity-40' />
        <span className='text-sm'>No products added yet</span>
        <span className='text-xs opacity-60'>Use the search above to add products</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-x-auto rounded-lg border ${updating ? 'pointer-events-none opacity-60' : ''}`}>
      {updating && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/20'>
          <Spinner className='size-5' />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/50 hover:bg-muted/50'>
            <TableHead className='w-[52px]' />
            <TableHead className='w-[120px]'>Product ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className='w-[140px]'>Qty</TableHead>
            <TableHead className='hidden w-[100px] md:table-cell'>Unit Price</TableHead>
            <TableHead className='w-[100px]'>Total</TableHead>
            <TableHead className='w-[80px]' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className='bg-muted flex size-10 items-center justify-center overflow-hidden rounded'>
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className='size-full object-cover' />
                  ) : (
                    <Image className='text-muted-foreground size-4' />
                  )}
                </div>
              </TableCell>
              <TableCell className='font-mono text-sm font-medium'>{item.product_id}</TableCell>
              <TableCell className='max-w-[200px] truncate'>{item.name}</TableCell>
              <TableCell>
                <QuantityInput
                  value={item.quantity}
                  maxCount={item.max_count}
                  ignoreCount={item.ignore_count}
                  disabled={updating}
                  onChange={(qty) => onQuantityChange(item.id, qty)}
                />
              </TableCell>
              <TableCell className='text-muted-foreground hidden md:table-cell'>
                {formatCurrency(item.price)}
              </TableCell>
              <TableCell className='font-semibold'>
                {formatCurrency((item.price || 0) * (item.quantity || 0))}
              </TableCell>
              <TableCell>
                <div className='flex justify-center gap-0.5'>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    disabled={updating}
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    disabled={updating}
                    className='text-destructive hover:text-destructive'
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className='size-3.5' />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function QuantityInput({
  value,
  maxCount = 9999,
  ignoreCount = false,
  disabled = false,
  onChange,
}: {
  value: number
  maxCount?: number
  ignoreCount?: boolean
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const maxAllowed = ignoreCount ? 9999 : maxCount
  const hasError = !ignoreCount && value > maxCount
  const isDisabled = disabled || (!ignoreCount && maxCount <= 0)

  return (
    <div className='flex flex-col gap-1'>
      <div
        className={`inline-flex items-center rounded-md border p-0.5 ${
          hasError ? 'border-destructive' : 'border-input'
        } ${isDisabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <button
          type='button'
          className='hover:bg-muted flex size-7 items-center justify-center rounded transition-colors disabled:opacity-40'
          disabled={isDisabled || value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus className='size-3' />
        </button>
        <input
          type='number'
          className='w-10 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          value={value}
          min={1}
          max={maxAllowed}
          disabled={isDisabled}
          onChange={(e) => {
            const num = parseInt(e.target.value, 10)
            if (!isNaN(num) && num >= 1) onChange(num)
          }}
          onBlur={(e) => {
            const num = parseInt(e.target.value, 10)
            if (isNaN(num) || num < 1) onChange(1)
          }}
        />
        <button
          type='button'
          className='hover:bg-muted flex size-7 items-center justify-center rounded transition-colors disabled:opacity-40'
          disabled={isDisabled || (!ignoreCount && value >= maxCount)}
          onClick={() => onChange(value + 1)}
        >
          <Plus className='size-3' />
        </button>
      </div>
      {hasError && (
        <span className='text-destructive text-xs'>Only {maxCount} available</span>
      )}
    </div>
  )
}
