import { useRouter } from '@tanstack/react-router'
import { ArrowLeft, FilePlus2 } from 'lucide-react'

import { CreatePageActions } from './create-page-actions'

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
      <div className='flex items-center gap-2'>
        <button
          type='button'
          className='flex items-center gap-1 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ArrowLeft className='size-3.5' />
          Back
        </button>
        <span className='text-text-tertiary'>/</span>
        <div className='flex items-center gap-1.5'>
          <FilePlus2 className='size-4 shrink-0 text-text-tertiary' />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Create New</h1>
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
