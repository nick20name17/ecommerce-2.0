import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'

import { IUser, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useState } from 'react'

import { UserDeleteDialog } from './-components/user-delete-dialog'
import { UserModal } from './-components/user-modal'
import { UsersDataTable } from './-components/users-data-table'
import { getUsersQuery } from '@/api/user/query'
import type { User, UserParams } from '@/api/user/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { isAdmin, isSuperAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'
import { useDebouncedCallback } from 'use-debounce'

const UsersPage = () => {
  const { user } = useAuth()
  const [projectId] = useProjectId()
  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)

  const [search, setSearch] = useSearchParam()
  const handleSearch = useDebouncedCallback((value: string) => setSearch(value || null), 300)
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalUser, setModalUser] = useState<User | 'create' | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const params: UserParams = {
    search: search || undefined,
    offset,
    limit,
    ordering,
    project: userIsSuperAdmin && projectId != null ? projectId : undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQuery(params),
    placeholderData: keepPreviousData
  })

  const editingUser = typeof modalUser === 'object' ? modalUser : null

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IUser} color={PAGE_COLORS.users} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Users</h1>
        </div>

        <div className='flex-1' />

        <div className='hidden h-7 w-[260px] items-center gap-1.5 rounded-[5px] border border-border bg-background px-2 transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:flex'>
          <Search className='size-3 shrink-0 text-text-tertiary' />
          <input
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Search by name or email...'
            className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>

        <button
          type='button'
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-[80ms] hover:opacity-90 sm:px-2.5'
          onClick={() => setModalUser('create')}
        >
          <Plus className='size-3.5' />
          <span className='hidden sm:inline'>Add User</span>
        </button>
      </header>

      <div className='flex-1 overflow-auto'>
        <UsersDataTable
          data={data?.results ?? []}
          isLoading={isLoading || isPlaceholderData}
          sorting={sorting}
          setSorting={setSorting}
          onEdit={setModalUser}
          onDelete={setDeleteUser}
        />
      </div>

      <div className='shrink-0 border-t border-border px-6 py-2'>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

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

export const Route = createFileRoute('/_authenticated/users/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: UsersPage,
  head: () => ({
    meta: [{ title: 'Users' }]
  })
})
