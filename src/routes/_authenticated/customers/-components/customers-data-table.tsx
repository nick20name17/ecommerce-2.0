'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getCustomerColumns } from './customer-columns'
import type { Customer } from '@/api/customer/schema'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { DataTable } from '@/components/common/data-table'

interface CustomersDataTableProps {
  data: Customer[]
  fieldConfig: FieldConfigResponse | null | undefined
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onRowClick: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
  onAssign?: (customer: Customer) => void
  canAssign?: boolean
}

export const CustomersDataTable = ({
  data,
  fieldConfig,
  isLoading,
  sorting,
  setSorting,
  onRowClick,
  onEdit,
  onDelete,
  onAssign,
  canAssign
}: CustomersDataTableProps) => {
  const columns = useMemo(
    () =>
      getCustomerColumns({
        fieldConfig,
        data,
        onEdit,
        onDelete,
        onAssign,
        canAssign
      }),
    [fieldConfig, data, onEdit, onDelete, onAssign, canAssign]
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      className='flex-1'
      onRowClick={(row) => onRowClick(row.original)}
    />
  )
}
