import type { Row } from '@tanstack/react-table'

import type { Order } from '@/api/order/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCellValue, getKeysFromRows, humanizeKey } from '@/helpers/dynamic-columns'
import { formatCurrency, formatQuantity } from '@/helpers/formatters'

const formatItemCellValue = (key: string, value: unknown): string => {
  if (value == null || (typeof value === 'string' && value.trim() === '')) return '—'
  if (key === 'price' || key === 'so_amount') return formatCurrency(value as string | number, '—')
  if (key === 'quan') return formatQuantity(value as string | number, 0, '—')
  return formatCellValue(value)
}

export const OrderExpandedRow = ({ row }: { row: Row<Order> }) => {
  const order = row.original
  const items = (order.items ?? []) as unknown as Record<string, unknown>[]

  const keys = getKeysFromRows(items)

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Order Items</h3>
        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
          <span>
            Customer: <span className='text-foreground font-semibold'>{order.name ?? '—'}</span>
          </span>
          <span>
            Subtotal:{' '}
            <span className='text-foreground font-medium'>
              {formatCurrency(order.subtotal, '—')}
            </span>
          </span>
          <span>
            Tax:{' '}
            <span className='text-foreground font-medium'>{formatCurrency(order.tax, '—')}</span>
          </span>
          <span>
            Balance:{' '}
            <span className='text-foreground font-medium'>
              {formatCurrency(order.balance, '—')}
            </span>
          </span>
        </div>
      </div>

      {!items.length ? (
        <p className='text-muted-foreground text-sm'>No order items.</p>
      ) : (
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow className='border-none'>
                {keys.map((key) => (
                  <TableHead
                    key={key}
                    className='min-w-[80px] shadow-[inset_0_-1px_0_var(--border)]'
                  >
                    {humanizeKey(key)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={(item.autoid as string) ?? index}>
                  {keys.map((key) => {
                    const val = formatItemCellValue(key, item[key])
                    const isTruncate = key === 'descr' || key === 'inven'
                    return (
                      <TableCell
                        key={key}
                        className='min-w-[80px] border-b'
                      >
                        {isTruncate ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className='block max-w-[240px] truncate'>{val}</span>
                            </TooltipTrigger>
                            <TooltipContent>{val}</TooltipContent>
                          </Tooltip>
                        ) : (
                          val
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
