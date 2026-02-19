import { createFileRoute } from '@tanstack/react-router'
import { Truck } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/shipping/')({
  component: ShippingPage,
})

function ShippingPage() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-muted-foreground'>
      <Truck className='size-12 opacity-50' />
      <h1 className='text-2xl font-bold text-foreground'>Shipping</h1>
      <p className='text-sm'>Shipping content will be implemented here.</p>
    </div>
  )
}
