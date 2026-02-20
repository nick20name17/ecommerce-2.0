import type { Row } from '@tanstack/react-table'

import type { Order } from '@/api/order/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatQuantity } from '@/helpers/formatters'

export function OrderExpandedRow({ row }: { row: Row<Order> }) {
  const order = row.original
  const items = order.items ?? []

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Order Items</h3>
        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
          <span>
            Customer: <span className='text-foreground font-semibold'>{order.name}</span>
          </span>
          <span>
            Subtotal: <span className='text-foreground font-medium'>{formatCurrency(order.subtotal)}</span>
          </span>
          <span>
            Tax: <span className='text-foreground font-medium'>{formatCurrency(order.tax)}</span>
          </span>
          <span>
            Balance: <span className='text-foreground font-medium'>{formatCurrency(order.balance)}</span>
          </span>
        </div>
      </div>

      {!items.length ? (
        <p className='text-muted-foreground text-sm'>No line items.</p>
      ) : (
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow className='border-none'>
                <TableHead className='w-[130px] min-w-[130px] shadow-[inset_0_-1px_0_var(--border)]'>
                  Item Code
                </TableHead>
                <TableHead className='shadow-[inset_0_-1px_0_var(--border)]'>
                  Description
                </TableHead>
                <TableHead className='w-[100px] min-w-[100px] shadow-[inset_0_-1px_0_var(--border)]'>
                  Quantity
                </TableHead>
                <TableHead className='w-[100px] min-w-[100px] shadow-[inset_0_-1px_0_var(--border)]'>
                  Price
                </TableHead>
                <TableHead className='w-[110px] min-w-[110px] shadow-[inset_0_-1px_0_var(--border)]'>
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.autoid}>
                  <TableCell className='border-b w-[130px] min-w-[130px]'>
                    {item.inven}
                  </TableCell>
                  <TableCell className='border-b font-semibold'>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='block max-w-full truncate'>{item.descr || '—'}</span>
                      </TooltipTrigger>
                      <TooltipContent>{item.descr}</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className='border-b w-[100px] min-w-[100px]'>
                    {formatQuantity(item.quan, 0)}
                  </TableCell>
                  <TableCell className='border-b w-[100px] min-w-[100px]'>
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className='border-b font-bold w-[110px] min-w-[110px]'>
                    {formatCurrency(item.so_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
