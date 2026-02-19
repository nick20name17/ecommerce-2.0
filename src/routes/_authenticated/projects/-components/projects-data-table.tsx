'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getProjectColumns } from './project-columns'
import type { Project } from '@/api/project/schema'
import { DataTable } from '@/components/common/data-table'

interface ProjectsDataTableProps {
  data: Project[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectsDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onEdit,
  onDelete
}: ProjectsDataTableProps) {
  const columns = useMemo(
    () =>
      getProjectColumns({
        onEdit,
        onDelete
      }),
    [onEdit, onDelete]
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
    />
  )
}
