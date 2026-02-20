import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { CustomerInfoCard } from './-components/customer-info-card'
import { CustomerOrdersTab } from './-components/customer-orders-tab'
import { getCustomerDetailQuery } from '@/api/customer/query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectId } from '@/hooks/use-project-id'

export const Route = createFileRoute('/_authenticated/customers/$customerId/')({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const [projectId] = useProjectId()

  const { data: customer, isLoading } = useQuery(getCustomerDetailQuery(customerId, projectId))

  if (isLoading) {
    return (
      <div className='flex h-full flex-col gap-4'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-9 w-9' />
          <Skeleton className='h-8 w-48' />
        </div>
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <p className='text-muted-foreground'>Customer not found.</p>
        <Button variant='outline' asChild>
          <Link to='/customers'>Back to Customers</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-4 overflow-y-auto p-1'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='icon' asChild>
          <Link to='/customers'>
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className='text-2xl font-bold'>{customer.l_name}</h1>
      </div>

      <div className='grid flex-1 items-start gap-4 min-h-0 lg:grid-cols-[380px_1fr]'>
        <CustomerInfoCard customer={customer} />
        <div className='flex flex-col min-h-0'>
          <h2 className='text-lg font-semibold mb-2'>Orders</h2>
          <CustomerOrdersTab customerId={customerId} />
        </div>
      </div>
    </div>
  )
}
