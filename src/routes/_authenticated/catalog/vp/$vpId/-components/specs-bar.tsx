import { Plus } from 'lucide-react'
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
}

/**
 * Compact horizontal bar showing specs as pills.
 * Clicking "Manage Specs" opens the full VPSpecsSection in a dialog.
 */
export const SpecsBar = ({ vp, projectId }: SpecsBarProps) => {
  const [manageOpen, setManageOpen] = useState(false)
  const specs = vp.spec_definitions

  return (
    <>
      <div className='flex items-center gap-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>
          Specs
        </h3>
        <div className='flex flex-1 flex-wrap items-center gap-1.5'>
          {specs.map((spec) => (
            <span
              key={spec.id}
              className='inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-secondary px-2 py-1 text-[12px] font-medium text-text-secondary'
            >
              {spec.name}
              <span className='text-[10px] capitalize text-text-quaternary'>
                {spec.display_type}
              </span>
              {(spec.option_count ?? spec.options?.length ?? 0) > 0 && (
                <span className='text-[10px] tabular-nums text-text-quaternary'>
                  · {spec.option_count ?? spec.options?.length ?? 0} options
                </span>
              )}
            </span>
          ))}
          {specs.length === 0 && (
            <span className='text-[12px] text-text-tertiary'>No specs defined</span>
          )}
        </div>
        <Button variant='outline' size='xs' onClick={() => setManageOpen(true)}>
          <Plus className='size-3' />
          Manage Specs
        </Button>
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
