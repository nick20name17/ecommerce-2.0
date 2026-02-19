import type { Customer } from '@/api/customer/schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerTypeLabel } from '@/constants/customer'
import { formatDate, formatPhone } from '@/helpers/formatters'

interface CustomerInfoCardProps {
  customer: Customer
}

export const CustomerInfoCard = ({ customer }: CustomerInfoCardProps) => {
  const addressParts = [customer.address1, customer.address2]
    .filter(Boolean)
    .join(', ')
  const cityStateZip = [customer.city, customer.state, customer.zip]
    .filter(Boolean)
    .join(', ')
  const addressBlock = [addressParts, cityStateZip, customer.country]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          Customer Information
          <Badge variant={customer.inactive ? 'outline' : 'success'}>
            {customer.inactive ? 'Inactive' : 'Active'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-sm'>
          <span className='text-muted-foreground'>ID</span>
          <span className='font-medium'>{customer.id}</span>

          <span className='text-muted-foreground'>Name</span>
          <span>{customer.l_name}</span>

          <span className='text-muted-foreground'>Phone</span>
          <span>{customer.contact_1 ? formatPhone(customer.contact_1) : '—'}</span>

          <span className='text-muted-foreground'>Email</span>
          <span className='truncate' title={customer.contact_3 ?? ''}>
            {customer.contact_3 ?? '—'}
          </span>

          <span className='text-muted-foreground'>Customer Type</span>
          <span>{getCustomerTypeLabel(customer.in_level)}</span>

          <span className='text-muted-foreground'>Last Order Date</span>
          <span>{formatDate(customer.last_order_date)}</span>
        </div>

        {addressBlock ? (
          <div className='text-sm'>
            <span className='text-muted-foreground'>Address</span>
            <p className='mt-0.5'>{addressBlock}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
