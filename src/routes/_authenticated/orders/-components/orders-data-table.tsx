'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { type OrderRow, getOrderColumns } from './order-columns'
import { OrderExpandedRow } from './order-expanded-row'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { DataTable } from '@/components/common/data-table'

interface OrdersDataTableProps {
  data: OrderRow[]
  fieldConfig: FieldConfigResponse | null | undefined
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onDelete: (order: OrderRow) => void
  onDeleteLinkedProposal: (order: OrderRow) => void
  onAttachments: (order: OrderRow) => void
  onNotes?: (order: OrderRow) => void
  onAssign?: (order: OrderRow) => void
  canAssign?: boolean
}

export const OrdersDataTable = ({
  data,
  fieldConfig,
  isLoading,
  sorting,
  setSorting,
  onDelete,
  onDeleteLinkedProposal,
  onAttachments,
  onNotes,
  onAssign,
  canAssign
}: OrdersDataTableProps) => {
  const columns = useMemo(
    () =>
      getOrderColumns({
        fieldConfig,
        data,
        onDelete,
        onDeleteLinkedProposal,
        onAttachments,
        onNotes,
        onAssign,
        canAssign
      }),
    [fieldConfig, data, onDelete, onDeleteLinkedProposal, onAttachments, onNotes, onAssign, canAssign]
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !row.original._pending && !!row.original.items?.length,
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
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
