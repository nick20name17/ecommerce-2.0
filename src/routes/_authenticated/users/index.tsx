'use no memo'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getUserColumns } from './-components/user-columns'
import { UserDeleteDialog } from './-components/user-delete-dialog'
import { UserModal } from './-components/user-modal'
import { getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { DataTable } from '@/components/common/data-table'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage
})

function UsersPage() {
  const { user: currentUser } = useAuth()

  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalUser, setModalUser] = useState<User | 'create' | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const params: UserParams = {
    search: search || undefined,
    offset,
    limit,
    ordering
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQuery(params),
    placeholderData: keepPreviousData
  })

  const columns = useMemo(
    () =>
      getUserColumns({
        currentUserId: currentUser?.id,
        onEdit: setModalUser,
        onDelete: setDeleteUser
      }),
    [currentUser?.id]
  )

  const table = useReactTable({
    columns,
    data: data?.results ?? [],
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualSorting: true
  })

  const editingUser = typeof modalUser === 'object' ? modalUser : null

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Users</h1>
        <Button onClick={() => setModalUser('create')}>
          <Plus />
          Add User
        </Button>
      </div>

      <SearchFilter placeholder='Search users...' />

      <DataTable
        table={table}
        isLoading={isLoading || isPlaceholderData}
        className='flex-1'
      />

      <Pagination totalCount={data?.count ?? 0} />

      <UserModal
        key={editingUser?.id ?? 'create'}
        open={modalUser !== null}
        onOpenChange={(open) => !open && setModalUser(null)}
        user={editingUser}
      />
      <UserDeleteDialog
        user={deleteUser}
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
      />
    </div>
  )
}
