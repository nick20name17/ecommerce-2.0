import { Layers, Plus, Settings } from 'lucide-react'
import { useState } from 'react'

import type { VariableProduct } from '@/api/variable-product/schema'
import { VPSpecsSection } from './vp-specs-section'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SpecsBarProps {
  vp: VariableProduct
  projectId: number | null
  onAddProducts: () => void
}

/**
 * Unified header for specs + variants.
 * Shows spec pills inline with action buttons.
 */
export const SpecsBar = ({ vp, projectId, onAddProducts }: SpecsBarProps) => {
  const [manageOpen, setManageOpen] = useState(false)
  const specs = vp.spec_definitions

  return (
    <>
      <div className='flex flex-col gap-2'>
        {/* Title row */}
        <div className='flex items-center gap-2'>
          <h3 className='text-[14px] font-semibold text-foreground'>
            Variants
            <span className='ml-1.5 text-[13px] font-normal tabular-nums text-text-tertiary'>
              {vp.items.length}
            </span>
          </h3>
          <div className='flex-1' />
          <Button variant='ghost' size='xs' className='text-text-tertiary' onClick={() => setManageOpen(true)}>
            <Settings className='size-3' />
            Specs
          </Button>
          <Button variant='outline' size='xs' onClick={onAddProducts}>
            <Plus className='size-3' />
            Add Products
          </Button>
        </div>

        {/* Spec pills */}
        {specs.length > 0 && (
          <div className='flex flex-wrap items-center gap-1.5'>
            {specs.map((spec) => (
              <button
                key={spec.id}
                type='button'
                className='inline-flex items-center gap-1 rounded-full border border-border bg-bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-active'
                onClick={() => setManageOpen(true)}
              >
                <Layers className='size-2.5 text-text-quaternary' />
                {spec.name}
                <span className='text-text-quaternary'>
                  {spec.option_count ?? spec.options?.length ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Manage Specs</DialogTitle>
          </DialogHeader>
          <DialogBody className='max-h-[60vh] overflow-y-auto'>
            <VPSpecsSection vp={vp} projectId={projectId} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  )
}
