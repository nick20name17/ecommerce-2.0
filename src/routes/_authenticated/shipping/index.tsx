import { createFileRoute } from '@tanstack/react-router'
import { Truck } from 'lucide-react'

const ShippingPage = () => (
  <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3'>
    <Truck className='size-12 opacity-50' />
    <h1 className='text-foreground text-2xl font-bold'>Shipping</h1>
    <p className='text-sm'>Shipping content will be implemented here.</p>
  </div>
)

export const Route = createFileRoute('/_authenticated/shipping/')({
  component: ShippingPage,
  head: () => ({
    meta: [{ title: 'Shipping' }]
  })
})
