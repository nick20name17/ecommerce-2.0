'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getProposalColumns } from './proposal-columns'
import type { Proposal } from '@/api/proposal/schema'
import { DataTable } from '@/components/common/data-table'

interface ProposalsDataTableProps {
  data: Proposal[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onView: (proposal: Proposal) => void
}

export function ProposalsDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onView,
}: ProposalsDataTableProps) {
  const columns = useMemo(() => getProposalColumns({ onView }), [onView])

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
      className="flex-1 min-h-0"
    />
  )
}
