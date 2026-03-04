import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/order-desk/')({
  component: OrderDeskPage,
  head: () => ({
    meta: [{ title: 'Order Desk' }]
  })
})

function OrderDeskPage() {
  return (
    <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3'>
      <ClipboardList className='size-12 opacity-50' />
      <h1 className='text-foreground text-2xl font-bold'>Order Desk</h1>
      <p className='text-sm'>Order Desk content will be implemented here.</p>
    </div>
  )
}
