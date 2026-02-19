'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getCustomerColumns } from './customer-columns'
import type { Customer } from '@/api/customer/schema'
import { DataTable } from '@/components/common/data-table'

interface CustomersDataTableProps {
  data: Customer[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onRowClick: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomersDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onRowClick,
  onEdit,
  onDelete,
}: CustomersDataTableProps) {
  const columns = useMemo(
    () => getCustomerColumns({ onEdit, onDelete }),
    [onEdit, onDelete]
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true,
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
