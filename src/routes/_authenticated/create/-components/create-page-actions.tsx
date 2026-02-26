import { Eraser, FileCheck, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

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
  const isCreating = creatingProposal || creatingOrder
  const canSubmit = customerSelected && hasItems && !isBusy && !isCreating
  const submitTooltip = !customerSelected
    ? 'Select a customer first'
    : !hasItems
      ? 'Add at least one product'
      : isCreating
        ? 'Please wait…'
        : undefined

  return (
    <div
      className={cn('flex items-center gap-2', isCreating && 'pointer-events-none')}
      aria-busy={isCreating}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            disabled={!hasItems || isBusy || isCreating}
            onClick={onClearAll}
            className='text-muted-foreground hover:text-destructive'
          >
            {clearingCart ? <Spinner className='mr-1.5 size-3.5' /> : <Eraser className='mr-1.5 size-3.5' />}
            Clear
          </Button>
        </TooltipTrigger>
        {!hasItems && <TooltipContent>No items to clear</TooltipContent>}
      </Tooltip>

      <div className='h-4 w-px bg-border' />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            disabled={!canSubmit || isCreating}
            onClick={onCreateOrder}
          >
            {creatingOrder ? (
              <Spinner className='mr-1.5 size-3.5' />
            ) : (
              <ShoppingCart className='mr-1.5 size-3.5' />
            )}
            Order
          </Button>
        </TooltipTrigger>
        {submitTooltip && <TooltipContent>{submitTooltip}</TooltipContent>}
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size='sm'
            disabled={!canSubmit || isCreating}
            onClick={onCreateProposal}
          >
            {creatingProposal ? (
              <Spinner className='mr-1.5 size-3.5' />
            ) : (
              <FileCheck className='mr-1.5 size-3.5' />
            )}
            Proposal
          </Button>
        </TooltipTrigger>
        {submitTooltip && <TooltipContent>{submitTooltip}</TooltipContent>}
      </Tooltip>
    </div>
  )
}
