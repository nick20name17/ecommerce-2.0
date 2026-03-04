'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { getFieldColumns } from './field-columns'
import type { FieldConfigRow } from '@/api/field-config/schema'
import { DataTable } from '@/components/common/data-table'

interface FieldsDataTableProps {
  fields: FieldConfigRow[]
  isLoading: boolean
  entity: string
  projectId: number
  onFieldToggle: (entity: string, fieldName: string, enabled: boolean) => void
  isPending: boolean
}

export const FieldsDataTable = ({
  fields,
  isLoading,
  entity,
  onFieldToggle,
  isPending
}: FieldsDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => getFieldColumns(entity, onFieldToggle, isPending),
    [entity, onFieldToggle, isPending]
  )

  const table = useReactTable({
    columns,
    data: fields,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting }
  })

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      className='h-full'
    />
  )
}
