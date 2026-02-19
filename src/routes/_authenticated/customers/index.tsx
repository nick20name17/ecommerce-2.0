import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { CustomerDeleteDialog } from './-components/customer-delete-dialog'
import { CustomerModal } from './-components/customer-modal'
import { CustomersDataTable } from './-components/customers-data-table'
import { getCustomersQuery } from '@/api/customer/query'
import type { Customer, CustomerParams } from '@/api/customer/schema'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import { useLimitParam, useOffsetParam, useProjectIdParam, useSearchParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/customers/')({
  component: CustomersPage,
})

function CustomersPage() {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectIdParam()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalCustomer, setModalCustomer] = useState<Customer | 'create' | null>(null)
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null)

  const params: CustomerParams = {
    search: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined,
    fields: 'last_order_date',
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getCustomersQuery(params),
    placeholderData: keepPreviousData,
  })

  const editingCustomer = typeof modalCustomer === 'object' ? modalCustomer : null

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Customers</h1>
        <Button onClick={() => setModalCustomer('create')}>
          <Plus />
          Add Customer
        </Button>
      </div>

      <SearchFilter placeholder='Search customers...' />

      <CustomersDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onRowClick={(customer) =>
          navigate({
            to: '/customers/$customerId',
            params: { customerId: customer.id },
            search: (prev) => (projectId != null ? { ...prev, project_id: projectId } : prev),
          })
        }
        onEdit={setModalCustomer}
        onDelete={setDeleteCustomer}
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
    </div>
  )
}
