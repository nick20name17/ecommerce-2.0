import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { useState } from 'react'

import { UserDeleteDialog } from './-components/user-delete-dialog'
import { UserModal } from './-components/user-modal'
import { UsersDataTable } from './-components/users-data-table'
import { getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersPage,
  head: () => ({
    meta: [{ title: 'Users' }]
  })
})

function UsersPage() {
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

  const editingUser = typeof modalUser === 'object' ? modalUser : null
  const activeCount = data?.results?.filter((u) => u.is_active).length ?? 0

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Users className='size-5' />
            </div>
            <div>
              <h1 className='text-2xl font-semibold tracking-tight'>Users</h1>
              <p className='text-sm text-muted-foreground'>
                {data?.count ?? 0} total · {activeCount} active
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => setModalUser('create')} className='gap-2'>
          <Plus className='size-4' />
          Add User
        </Button>
      </header>

      <div className='flex items-center gap-3'>
        <SearchFilter placeholder='Search by name or email...' className='max-w-xs' />
      </div>

      <UsersDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={setModalUser}
        onDelete={setDeleteUser}
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
