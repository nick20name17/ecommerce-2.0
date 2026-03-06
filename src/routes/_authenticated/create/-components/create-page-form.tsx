import { Package, Paperclip, User } from 'lucide-react'

import { CreatePageSection } from './create-page-section'
import { CustomerCombobox } from './customer-combobox'
import type { Customer } from '@/api/customer/schema'
import {
  EntityAttachments,
  type EntityAttachmentsRef
} from '@/components/common/entity-attachments/entity-attachments'
import { Button } from '@/components/ui/button'

interface CreatePageFormProps {
  customer: Customer | null
  projectId: number | null
  hasCartItems: boolean
  setCatalogOpen: (open: boolean) => void
  onCustomerChange: (c: Customer | null) => void
  attachmentsRef: React.RefObject<EntityAttachmentsRef | null>
  isBusy: boolean
}

export const CreatePageForm = ({
  customer,
  projectId,
  hasCartItems,
  setCatalogOpen,
  onCustomerChange,
  attachmentsRef,
  isBusy
}: CreatePageFormProps) => {
  return (
    <div className='flex flex-col gap-4'>
      <CreatePageSection
        icon={<User className='size-4' />}
        title='Customer'
        description='Select a customer for this proposal'
        step={1}
        isComplete={!!customer}
      >
        <CustomerCombobox
          value={customer}
          onChange={onCustomerChange}
          projectId={projectId}
        />
      </CreatePageSection>

      <CreatePageSection
        icon={<Package className='size-4' />}
        title='Products'
        description='Search and add products by ID or description'
        step={2}
        isComplete={hasCartItems}
        isDisabled={!customer}
        allowOverflow
      >
        <div className='flex flex-col gap-3'>
          <Button
            type='button'
            className='w-full justify-between'
            disabled={!customer || isBusy}
            onClick={() => setCatalogOpen(true)}
          >
            <span>Browse catalog</span>
            <span className='text-primary-foreground/80 text-xs font-normal'>
              Categories · Search · Prices
            </span>
          </Button>
          <p className='text-muted-foreground text-xs'>
            Use the catalog to filter by category and search across products. Configurable
            products will prompt for options.
          </p>
        </div>
      </CreatePageSection>

      <CreatePageSection
        icon={<Paperclip className='size-4' />}
        title='Attachments'
        description='Add files to attach to the proposal or order after creation'
        isDisabled={!customer}
      >
        <EntityAttachments
          ref={attachmentsRef}
          entityType='proposal'
          projectId={projectId}
          mode='deferred'
        />
      </CreatePageSection>
    </div>
  )
}
