import { Package, Paperclip, User } from 'lucide-react'
import { useState } from 'react'

import { CreatePageSection } from './create-page-section'
import { CustomerCombobox } from './customer-combobox'
import type { Customer } from '@/api/customer/schema'
import {
  EntityAttachments,
  type EntityAttachmentsRef
} from '@/components/common/entity-attachments/entity-attachments'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)

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
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              className='flex-1 justify-between'
              disabled={!customer || isBusy}
              onClick={() => setCatalogOpen(true)}
            >
              <span>Browse catalog</span>
              <span className='text-primary-foreground/80 text-[13px] font-normal'>
                Categories · Search · Prices
              </span>
            </Button>
            <button
              type='button'
              className='inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-border bg-bg-secondary px-3 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-50'
              disabled={!customer}
              onClick={() => setAttachmentsOpen(true)}
            >
              <Paperclip className='size-3.5' />
              Attachments
            </button>
          </div>
          <p className='text-text-tertiary text-[13px]'>
            Use the catalog to filter by category and search across products. Configurable
            products will prompt for options.
          </p>
        </div>
      </CreatePageSection>

      <Dialog open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
        <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md'>
          <DialogHeader className='border-b border-border px-5 py-3'>
            <DialogTitle className='flex items-center gap-2 text-[14px]'>
              <Paperclip className='size-4 text-text-tertiary' />
              Attachments
            </DialogTitle>
          </DialogHeader>
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <EntityAttachments
              ref={attachmentsRef}
              entityType='proposal'
              projectId={projectId}
              mode='deferred'
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
