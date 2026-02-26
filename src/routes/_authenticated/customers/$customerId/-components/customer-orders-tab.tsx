'use no memo'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ColumnDef, Row } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { OrderDeleteDialog } from '@/routes/_authenticated/orders/-components/order-delete-dialog'
import { getOrdersQuery } from '@/api/order/query'
import type { Order, OrderParams } from '@/api/order/schema'
import { DataTable } from '@/components/common/data-table'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { createExpanderColumn } from '@/components/common/data-table/columns'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getOrderStatusLabel, ORDER_STATUS_CLASS } from '@/constants/order'
import { formatCurrency, formatDate, formatQuantity } from '@/helpers/formatters'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

interface OrderColumnsOptions {
  onDelete: (order: Order) => void
}

function getOrderColumns({ onDelete }: OrderColumnsOptions): ColumnDef<Order>[] {
  return [
    createExpanderColumn<Order>(),
    {
      accessorKey: 'invoice',
      header: ({ column }) => <ColumnHeader column={column} title='Invoice' />,
      cell: ({ row }) => {
        const invoice = row.original.invoice
        if (!invoice) return <span className='text-muted-foreground'>—</span>
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block max-w-full truncate'>{invoice}</span>
            </TooltipTrigger>
            <TooltipContent>{invoice}</TooltipContent>
          </Tooltip>
        )
      },
      size: 110,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant='outline' className={cn('font-medium', ORDER_STATUS_CLASS[status] ?? '')}>
            {getOrderStatusLabel(status)}
          </Badge>
        )
      },
      size: 110,
      enableSorting: false,
    },
    {
      accessorKey: 'inv_date',
      header: ({ column }) => <ColumnHeader column={column} title='Date' />,
      cell: ({ row }) => formatDate(row.original.inv_date),
      size: 120,
    },
    {
      accessorKey: 'subtotal',
      header: ({ column }) => <ColumnHeader column={column} title='Subtotal' />,
      cell: ({ row }) => formatCurrency(row.original.subtotal),
      size: 100,
    },
    {
      accessorKey: 'tax',
      header: 'Tax',
      cell: ({ row }) => formatCurrency(row.original.tax),
      size: 90,
      enableSorting: false,
    },
    {
      accessorKey: 'total',
      header: ({ column }) => <ColumnHeader column={column} title='Total' />,
      cell: ({ row }) => <span className='font-medium'>{formatCurrency(row.original.total)}</span>,
      size: 100,
    },
    {
      accessorKey: 'balance',
      header: ({ column }) => <ColumnHeader column={column} title='Balance' />,
      cell: ({ row }) => formatCurrency(row.original.balance),
      size: 100,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className='flex justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm'>
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem variant='destructive' onClick={() => onDelete(row.original)}>
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      size: 50,
      enableSorting: false,
    },
  ]
}

function OrderExpandedRow({ row }: { row: Row<Order> }) {
  const order = row.original
  const items = order.items ?? []

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Order Items</h3>
        <div className='text-muted-foreground flex items-center gap-4 text-sm'>
          <span>
            Customer ID: <span className='text-foreground font-semibold'>{order.name}</span>
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

interface CustomerOrdersTabProps {
  customerId: string
}

export function CustomerOrdersTab({ customerId }: CustomerOrdersTabProps) {
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  const params: OrderParams = {
    customer_id: customerId,
    invoice: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined,
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getOrdersQuery(params),
    placeholderData: keepPreviousData,
  })

  const columns = useMemo(() => getOrderColumns({ onDelete: setOrderToDelete }), [])

  const table = useReactTable({
    columns,
    data: data?.results ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!row.original.items?.length,
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true,
  })

  return (
    <div className='flex h-full min-w-0 flex-col gap-4'>
      <SearchFilter placeholder='Search orders...' />

      <DataTable
        table={table}
        isLoading={isLoading || isPlaceholderData}
        className='flex-1 min-w-0'
        renderSubComponent={(row) => <OrderExpandedRow row={row} />}
        fitWidth
      />

      <Pagination totalCount={data?.count ?? 0} />

      <OrderDeleteDialog
        order={orderToDelete}
        projectId={projectId}
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      />
    </div>
  )
}
