'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import type { PayloadLog } from '@/api/payload-log/schema'

import { getPayloadLogColumns } from './payload-log-columns'
import { DataTable } from '@/components/common/data-table'

interface PayloadLogsDataTableProps {
  data: PayloadLog[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onView: (log: PayloadLog) => void
}

export function PayloadLogsDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onView
}: PayloadLogsDataTableProps) {
  const columns = useMemo(() => getPayloadLogColumns({ onView }), [onView])

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
    />
  )
}
