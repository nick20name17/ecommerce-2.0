'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { type ProposalRow, getProposalColumns } from './proposal-columns'
import { ProposalExpandedRow } from './proposal-expanded-row'
import type { FieldConfigResponse } from '@/api/field-config/schema'
import { DataTable } from '@/components/common/data-table'

interface ProposalsDataTableProps {
  data: ProposalRow[]
  fieldConfig: FieldConfigResponse | null | undefined
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  isSuperAdmin: boolean
  projectId: number | null
  onDelete: (proposal: ProposalRow) => void
  onAttachments: (proposal: ProposalRow) => void
  onAssign?: (proposal: ProposalRow) => void
  canAssign?: boolean
}

export function ProposalsDataTable({
  data,
  fieldConfig,
  isLoading,
  sorting,
  setSorting,
  isSuperAdmin,
  projectId,
  onDelete,
  onAttachments,
  onAssign,
  canAssign
}: ProposalsDataTableProps) {
  const columns = useMemo(
    () =>
      getProposalColumns({
        fieldConfig,
        data,
        isSuperAdmin,
        projectId,
        onDelete,
        onAttachments,
        onAssign,
        canAssign
      }),
    [fieldConfig, data, isSuperAdmin, projectId, onDelete, onAttachments, onAssign, canAssign]
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
      className='min-h-0 flex-1'
      renderSubComponent={(row) => <ProposalExpandedRow row={row} />}
    />
  )
}
