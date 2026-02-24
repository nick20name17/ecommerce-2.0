'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getFieldColumns } from './field-columns'
import type { TableField } from '@/api/data-schema/schema'
import { DataTable } from '@/components/common/data-table'

interface FieldsDataTableProps {
  fields: TableField[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
}

export function FieldsDataTable({
  fields,
  isLoading,
  sorting,
  setSorting
}: FieldsDataTableProps) {
  const columns = useMemo(() => getFieldColumns(), [])

  const table = useReactTable({
    columns,
    data: fields,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
  })

  return <DataTable table={table} isLoading={isLoading} className='h-full' />
}
