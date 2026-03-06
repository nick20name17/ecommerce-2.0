import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, FilePlus2 } from 'lucide-react'

import { CreatePageActions } from './create-page-actions'
import { Button } from '@/components/ui/button'

interface CreatePageHeaderProps {
  customerSelected: boolean
  hasItems: boolean
  isBusy: boolean
  clearingCart: boolean
  creatingProposal: boolean
  creatingOrder: boolean
  onClearAll: () => void
  onCreateProposal: () => void
  onCreateOrder: () => void
}

export const CreatePageHeader = ({
  customerSelected,
  hasItems,
  isBusy,
  clearingCart,
  creatingProposal,
  creatingOrder,
  onClearAll,
  onCreateProposal,
  onCreateOrder
}: CreatePageHeaderProps) => {
  const router = useRouter()
  return (
    <header className='flex min-w-0 items-center justify-between gap-4 pb-4'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
          className='shrink-0'
          onClick={() => router.history.back()}
        >
          <ArrowLeft className='size-4' />
        </Button>
        <div className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg'>
          <FilePlus2 className='size-5' />
        </div>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold tracking-tight'>Create New</h1>
          <p className='text-muted-foreground text-sm'>Build a proposal or order</p>
        </div>
      </div>
      <CreatePageActions
        customerSelected={customerSelected}
        hasItems={hasItems}
        isBusy={isBusy}
        clearingCart={clearingCart}
        creatingProposal={creatingProposal}
        creatingOrder={creatingOrder}
        onClearAll={onClearAll}
        onCreateProposal={onCreateProposal}
        onCreateOrder={onCreateOrder}
      />
    </header>
  )
}
