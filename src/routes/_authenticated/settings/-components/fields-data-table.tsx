'use no memo'

import { getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
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
  onAliasSubmit: (entity: string, fieldName: string, alias: string) => void
  isPending: boolean
  isAliasPending: boolean
}

export const FieldsDataTable = ({
  fields,
  isLoading,
  entity,
  onFieldToggle,
  onAliasSubmit,
  isPending,
  isAliasPending
}: FieldsDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo(
    () => getFieldColumns(entity, onFieldToggle, onAliasSubmit, isPending, isAliasPending),
    [entity, onFieldToggle, onAliasSubmit, isPending, isAliasPending]
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

