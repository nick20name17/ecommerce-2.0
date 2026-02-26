'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getProposalColumns, type ProposalRow } from './proposal-columns'
import { ProposalExpandedRow } from './proposal-expanded-row'
import { DataTable } from '@/components/common/data-table'

interface ProposalsDataTableProps {
  data: ProposalRow[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  isSuperAdmin: boolean
  projectId: number | null
  onDelete: (proposal: ProposalRow) => void
  onAttachments: (proposal: ProposalRow) => void
}

export function ProposalsDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  isSuperAdmin,
  projectId,
  onDelete,
  onAttachments
}: ProposalsDataTableProps) {
  const columns = useMemo(
    () => getProposalColumns({ isSuperAdmin, projectId, onDelete, onAttachments }),
    [isSuperAdmin, projectId, onDelete, onAttachments]
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
      className="flex-1 min-h-0"
      renderSubComponent={(row) => <ProposalExpandedRow row={row} />}
    />
  )
}
