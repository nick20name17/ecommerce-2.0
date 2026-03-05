import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, UsersRound } from 'lucide-react'
import { useState } from 'react'

import { CustomerAssignDialog } from './-components/customer-assign-dialog'
import { CustomerDeleteDialog } from './-components/customer-delete-dialog'
import { CustomerModal } from './-components/customer-modal'
import { CustomersDataTable } from './-components/customers-data-table'
import { getCustomersQuery } from '@/api/customer/query'
import type { Customer, CustomerParams } from '@/api/customer/schema'
import { EntityNotesSheet } from '@/components/common/entity-notes/entity-notes-sheet'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { isAdmin } from '@/constants/user'
import { useOrdering } from '@/hooks/use-ordering'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { useAuth } from '@/providers/auth'

const CustomersPage = () => {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const { user } = useAuth()
  const canAssign = !!user?.role && isAdmin(user.role)

  const [modalCustomer, setModalCustomer] = useState<Customer | 'create' | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)
  const [customerForNotes, setCustomerForNotes] = useState<Customer | null>(null)
  const [assignCustomer, setAssignCustomer] = useState<Customer | null>(null)

  const params: CustomerParams = {
    search: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCustomersQuery(params),
    placeholderData: keepPreviousData
  })

  const editingCustomer = typeof modalCustomer === 'object' ? modalCustomer : null

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg'>
            <UsersRound className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Customers</h1>
            <p className='text-muted-foreground text-sm'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button
          onClick={() => setModalCustomer('create')}
          className='gap-2'
        >
          <Plus className='size-4' />
          Add Customer
        </Button>
      </header>

      <div className='flex items-center gap-3'>
        <SearchFilter placeholder='Search by name, email, or phone...' />
      </div>

      <CustomersDataTable
        data={data?.results ?? []}
        fieldConfig={null}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onRowClick={(customer) =>
          navigate({
            to: '/customers/$customerId',
            params: { customerId: customer.id }
          })
        }
        onEdit={setModalCustomer}
        onDelete={setDeleteCustomer}
        onNotes={setCustomerForNotes}
        onAssign={setAssignCustomer}
        canAssign={canAssign}
      />

      <Pagination totalCount={data?.count ?? 0} />

      <CustomerModal
        key={editingCustomer?.id ?? 'create'}
        open={modalCustomer !== null}
        onOpenChange={(open) => !open && setModalCustomer(null)}
        customer={editingCustomer}
      />
      <CustomerDeleteDialog
        customer={deleteCustomer}
        open={!!deleteCustomer}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
      />
      <CustomerAssignDialog
        customer={assignCustomer}
        open={!!assignCustomer}
        onOpenChange={(open) => !open && setAssignCustomer(null)}
        projectId={projectId}
      />

      <EntityNotesSheet
        open={!!customerForNotes}
        onOpenChange={(open) => !open && setCustomerForNotes(null)}
        entityType='customer'
        entityLabel={customerForNotes ? `Customer ${customerForNotes.l_name ?? customerForNotes.autoid}` : ''}
        autoid={customerForNotes?.autoid ?? ''}
        projectId={projectId}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/customers/')({
  component: CustomersPage,
  head: () => ({
    meta: [{ title: 'Customers' }]
  })
})
