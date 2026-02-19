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
                <TableHead className='shadow-[inset_0_-1px_0] shadow-gray-300' style={{ width: 130, minWidth: 130 }}>
                  Item Code
                </TableHead>
                <TableHead className='shadow-[inset_0_-1px_0] shadow-gray-300'>
                  Description
                </TableHead>
                <TableHead className='shadow-[inset_0_-1px_0] shadow-gray-300' style={{ width: 100, minWidth: 100 }}>
                  Quantity
                </TableHead>
                <TableHead className='shadow-[inset_0_-1px_0] shadow-gray-300' style={{ width: 100, minWidth: 100 }}>
                  Price
                </TableHead>
                <TableHead className='shadow-[inset_0_-1px_0] shadow-gray-300' style={{ width: 110, minWidth: 110 }}>
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.autoid}>
                  <TableCell className='border-b' style={{ width: 130, minWidth: 130 }}>
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
                  <TableCell className='border-b' style={{ width: 100, minWidth: 100 }}>
                    {formatQuantity(item.quan, 0)}
                  </TableCell>
                  <TableCell className='border-b' style={{ width: 100, minWidth: 100 }}>
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className='border-b font-bold' style={{ width: 110, minWidth: 110 }}>
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
