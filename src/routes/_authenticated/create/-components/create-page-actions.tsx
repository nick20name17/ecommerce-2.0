import { useNavigate } from '@tanstack/react-router'
import { Eraser, FileCheck, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface CreatePageActionsProps {
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

export function CreatePageActions({
  customerSelected,
  hasItems,
  isBusy,
  clearingCart,
  creatingProposal,
  creatingOrder,
  onClearAll,
  onCreateProposal,
  onCreateOrder,
}: CreatePageActionsProps) {
  const navigate = useNavigate()

  return (
    <div className='flex flex-wrap justify-end gap-2 p-4'>
      <Button variant='ghost' onClick={() => navigate({ to: '/' })}>
        Cancel
      </Button>
      <Button variant='outline' disabled={!hasItems || isBusy} onClick={onClearAll}>
        {clearingCart ? <Spinner className='mr-2 size-4' /> : <Eraser className='mr-2 size-4' />}
        Clear All
      </Button>
      <Button
        variant='default'
        disabled={!customerSelected || !hasItems || isBusy}
        onClick={onCreateProposal}
      >
        {creatingProposal ? (
          <Spinner className='mr-2 size-4' />
        ) : (
          <FileCheck className='mr-2 size-4' />
        )}
        Create Proposal
      </Button>
      <Button
        variant='secondary'
        disabled={!customerSelected || !hasItems || isBusy}
        onClick={onCreateOrder}
      >
        {creatingOrder ? (
          <Spinner className='mr-2 size-4' />
        ) : (
          <ShoppingCart className='mr-2 size-4' />
        )}
        Create Order
      </Button>
    </div>
  )
}
