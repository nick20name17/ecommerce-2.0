'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getOrderColumns } from './order-columns'
import { OrderExpandedRow } from './order-expanded-row'
import type { Order } from '@/api/order/schema'
import { DataTable } from '@/components/common/data-table'

interface OrdersDataTableProps {
  data: Order[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
}

export function OrdersDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
}: OrdersDataTableProps) {
  const columns = useMemo(() => getOrderColumns(), [])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!row.original.items?.length,
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true,
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      className='flex-1'
      renderSubComponent={(row) => <OrderExpandedRow row={row} />}
    />
  )
}
