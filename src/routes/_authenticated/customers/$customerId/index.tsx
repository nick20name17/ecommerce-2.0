import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { CustomerDashboardTab } from './-components/customer-dashboard-tab'
import { CustomerInfoCard } from './-components/customer-info-card'
import { CustomerOrdersTab } from './-components/customer-orders-tab'
import { CustomerTasksTab } from './-components/customer-tasks-tab'
import { getCustomerDetailQuery } from '@/api/customer/query'
import { Button } from '@/components/ui/button'
import { CUSTOMER_TABS } from '@/constants/customer'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectId } from '@/hooks/use-project-id'
import { useCustomerTabParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/customers/$customerId/')({
  component: CustomerDetailPage,
  head: () => ({
    meta: [{ title: 'Customer' }]
  })
})

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const router = useRouter()
  const [projectId] = useProjectId()
  const [activeTab, setActiveTab] = useCustomerTabParam()

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
        <Button
          variant='outline'
          onClick={() => router.history.back()}
        >
          Back to Customers
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-4 overflow-y-auto p-1'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.history.back()}
        >
          <ArrowLeft />
        </Button>
        <h1 className='text-2xl font-bold'>{customer.l_name}</h1>
      </div>

      <div className='grid min-h-0 min-w-0 flex-1 items-stretch gap-4 lg:grid-cols-[380px_1fr]'>
        <div className='min-w-0 self-start'>
          <CustomerInfoCard customer={customer} />
        </div>
        <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='flex h-full min-h-0 flex-col'
          >
            <TabsList
              variant='line'
              className='mb-2 shrink-0'
            >
              {CUSTOMER_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent
              value='dashboard'
              className='mt-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-1'
            >
              <CustomerDashboardTab
                customerId={customerId}
                projectId={projectId ?? null}
              />
            </TabsContent>
            <TabsContent
              value='orders'
              className='mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
            >
              <CustomerOrdersTab customerId={customerId} />
            </TabsContent>
            <TabsContent
              value='todos'
              className='mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
            >
              <CustomerTasksTab customerId={customerId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

