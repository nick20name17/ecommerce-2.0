'use no memo'

import type { SortingState } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'

import { getUserColumns } from './user-columns'
import type { User } from '@/api/user/schema'
import { DataTable } from '@/components/common/data-table'
import { useAuth } from '@/providers/auth'

interface UsersDataTableProps {
  data: User[]
  isLoading: boolean
  sorting: SortingState
  setSorting: (updater: React.SetStateAction<SortingState>) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

export function UsersDataTable({
  data,
  isLoading,
  sorting,
  setSorting,
  onEdit,
  onDelete
}: UsersDataTableProps) {
  const { user: currentUser } = useAuth()

  const columns = useMemo(
    () =>
      getUserColumns({
        currentUserId: currentUser?.id,
        onEdit,
        onDelete
      }),
    [currentUser?.id, onEdit, onDelete]
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
