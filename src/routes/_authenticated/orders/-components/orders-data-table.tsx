'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getOrderColumns, type OrderRow } from './order-columns'
import { OrderExpandedRow } from './order-expanded-row'
import { DataTable } from '@/components/common/data-table'

interface OrdersDataTableProps {
  data: OrderRow[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onDelete: (order: OrderRow) => void
  onDeleteLinkedProposal: (order: OrderRow) => void
  onAttachments: (order: OrderRow) => void
}

export function OrdersDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onDelete,
  onDeleteLinkedProposal,
  onAttachments,
}: OrdersDataTableProps) {
  const columns = useMemo(
    () => getOrderColumns({ onDelete, onDeleteLinkedProposal, onAttachments }),
    [onDelete, onDeleteLinkedProposal, onAttachments]
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !row.original._pending && !!row.original.items?.length,
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
