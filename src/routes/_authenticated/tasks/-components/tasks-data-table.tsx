'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getTaskColumns } from './task-columns'
import type { TaskListItem, TaskStatus } from '@/api/task/schema'
import { DataTable } from '@/components/common/data-table'

interface TasksDataTableProps {
  data: TaskListItem[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onEdit: (task: TaskListItem) => void
  onDelete: (task: TaskListItem) => void
  onView: (task: TaskListItem) => void
  statuses: TaskStatus[]
  onStatusChange: (task: TaskListItem, statusId: number) => void
  fitWidth?: boolean
}

export function TasksDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onEdit,
  onDelete,
  onView,
  statuses,
  onStatusChange,
  fitWidth,
}: TasksDataTableProps) {
  const columns = useMemo(
    () => getTaskColumns({ onEdit, onDelete, statuses, onStatusChange }),
    [onEdit, onDelete, statuses, onStatusChange]
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
      className='flex-1 min-w-0'
      onRowClick={(row) => onView(row.original)}
      fitWidth={fitWidth}
    />
  )
}
