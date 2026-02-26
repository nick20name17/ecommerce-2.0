import { Image, Pencil, Trash2 } from 'lucide-react'

import type { CartItem } from '@/api/product/schema'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/helpers/formatters'

interface CartTableProps {
  items: CartItem[]
  loading: boolean
  onEdit: (item: CartItem) => void
  onRemove: (itemId: number) => void
  onQuantityChange: (itemId: number, quantity: number) => void
}

export function CartTable({ items, loading, onEdit, onRemove, onQuantityChange }: CartTableProps) {
  if (loading) {
    return (
      <div className='space-y-3 p-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            className='h-14 w-full'
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center gap-2 py-10'>
        <Image className='size-8 opacity-40' />
        <span className='text-sm'>No products added yet</span>
        <span className='text-xs opacity-60'>Search for products to add them here</span>
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
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
                    <img
                      src={item.photo}
                      alt={item.name}
                      className='size-full object-cover'
                    />
                  ) : (
                    <Image className='text-muted-foreground size-4' />
                  )}
                </div>
              </TableCell>
              <TableCell className='font-mono text-sm font-medium'>{item.product_id}</TableCell>
              <TableCell className='max-w-[200px] min-w-0'>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='block truncate'>{item.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>{item.name}</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <NumberInput
                  value={item.quantity}
                  min={1}
                  max={item.ignore_count ? undefined : item.max_count}
                  size='sm'
                  showMaxMessage
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
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon-sm'
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

