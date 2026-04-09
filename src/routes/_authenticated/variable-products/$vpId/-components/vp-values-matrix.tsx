import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type {
  GlobalSpecDefinition,
  VariableProduct,
  VariableProductItem,
} from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface VPValuesMatrixProps {
  vp: VariableProduct
  projectId: number | null
  isMobile?: boolean
  isTablet?: boolean
}

export const VPValuesMatrix = ({ vp, projectId, isMobile, isTablet }: VPValuesMatrixProps) => {
  const [linkDialog, setLinkDialog] = useState<{
    spec: GlobalSpecDefinition
    itemId: string
  } | null>(null)

  const [selectedOptionId, setSelectedOptionId] = useState('')

  // For creating a new option inline
  const [newOptionValue, setNewOptionValue] = useState('')
  const [newOptionColorHex, setNewOptionColorHex] = useState('')
  const [showNewOption, setShowNewOption] = useState(false)

  const linkMutation = useMutation({
    mutationFn: () =>
      variableProductService.linkItemToOption(
        vp.id,
        linkDialog!.itemId,
        { spec_option_id: selectedOptionId },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Option linked',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetLinkForm()
      setLinkDialog(null)
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      variableProductService.unlinkItemFromOption(vp.id, itemId, optionId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Option unlinked',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
  })

  const createOptionAndLinkMutation = useMutation({
    mutationFn: async () => {
      const option = await variableProductService.createSpecOption(
        linkDialog!.spec.id,
        {
          value: newOptionValue,
          color_hex: newOptionColorHex || undefined,
        },
        { project_id: projectId ?? undefined }
      )
      await variableProductService.linkItemToOption(
        vp.id,
        linkDialog!.itemId,
        { spec_option_id: option.id },
        { project_id: projectId ?? undefined }
      )
    },
    meta: {
      successMessage: 'Option created and linked',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetLinkForm()
      setLinkDialog(null)
    },
  })

  const resetLinkForm = () => {
    setSelectedOptionId('')
    setNewOptionValue('')
    setNewOptionColorHex('')
    setShowNewOption(false)
  }

  if (vp.items.length === 0 || vp.spec_definitions.length === 0) {
    return (
      <div>
        <h3 className='text-[13px] font-semibold text-text-secondary mb-2'>Values Matrix</h3>
        <div className='rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-text-tertiary'>
          {vp.items.length === 0
            ? 'Add items first to assign spec options'
            : 'Add specs first to assign options'}
        </div>
      </div>
    )
  }

  // Build the matrix: rows = items, columns = spec_definitions
  // Each item has specs: Record<string, { option_id, value }>
  const getValueForCell = (
    item: VariableProductItem,
    spec: GlobalSpecDefinition
  ): { option_id: string; value: string } | undefined => {
    return item.specs[spec.slug]
  }

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>Values Matrix</h3>
      </div>

      <div className='rounded-lg border border-border overflow-x-auto'>
        <table className='min-w-full text-[13px]'>
          <thead>
            <tr className='bg-bg-secondary text-text-tertiary text-[12px] font-medium'>
              <th className={cn(
                'py-1.5 text-left font-medium sticky left-0 bg-bg-secondary z-10',
                isMobile ? 'px-2 min-w-[100px]' : isTablet ? 'px-2.5 min-w-[140px]' : 'px-3 min-w-[180px]'
              )}>
                Product
              </th>
              {vp.spec_definitions.map((spec) => (
                <th key={spec.id} className={cn(
                  'py-1.5 text-left font-medium whitespace-nowrap',
                  isMobile ? 'px-2 min-w-[80px]' : isTablet ? 'px-2.5 min-w-[100px]' : 'px-3 min-w-[120px]'
                )}>
                  {spec.name}
                  {!isMobile && !isTablet && (
                    <span className='ml-1 text-[10px] text-text-tertiary capitalize'>
                      ({spec.display_type})
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vp.items.map((item) => (
              <tr
                key={item.id}
                className='border-t border-border-light hover:bg-bg-hover transition-colors'
              >
                <td className={cn(
                  'py-1.5 font-medium whitespace-nowrap sticky left-0 bg-background z-10',
                  isMobile ? 'px-2' : isTablet ? 'px-2.5' : 'px-3'
                )}>
                  <div className={cn('truncate', isMobile ? 'max-w-[90px]' : isTablet ? 'max-w-[130px]' : 'max-w-[200px]')} title={item.descr_1}>
                    {item.descr_1 || item.product_id}
                  </div>
                </td>
                {vp.spec_definitions.map((spec) => {
                  const val = getValueForCell(item, spec)
                  // Find the matching option for swatch color display
                  const matchedOption = val
                    ? spec.options?.find((o) => o.id === val.option_id)
                    : undefined
                  return (
                    <td key={spec.id} className={cn('py-1.5 whitespace-nowrap', isMobile ? 'px-2' : isTablet ? 'px-2.5' : 'px-3')}>
                      {val ? (
                        <div className='flex items-center gap-1.5 group'>
                          {spec.display_type === 'swatch' && matchedOption?.color_hex && (
                            <div
                              className='size-4 rounded-full border border-border shrink-0'
                              style={{ backgroundColor: matchedOption.color_hex }}
                            />
                          )}
                          <span>{val.value}</span>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            className='sm:opacity-0 sm:group-hover:opacity-100 text-text-tertiary hover:text-destructive shrink-0'
                            onClick={() =>
                              unlinkMutation.mutate({
                                itemId: item.id,
                                optionId: val.option_id,
                              })
                            }
                          >
                            <Trash2 className='size-3' />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant='ghost'
                          size='xs'
                          className='text-text-tertiary h-6'
                          onClick={() => {
                            resetLinkForm()
                            setLinkDialog({ spec, itemId: item.id })
                          }}
                        >
                          <Plus className='size-3' />
                          Set
                        </Button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Link option dialog */}
      <Dialog
        open={!!linkDialog}
        onOpenChange={(v) => {
          if (!v) {
            setLinkDialog(null)
            resetLinkForm()
          }
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (showNewOption) {
                createOptionAndLinkMutation.mutate()
              } else {
                linkMutation.mutate()
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Set {linkDialog?.spec.name} Value
              </DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              {!showNewOption ? (
                <>
                  <div className='flex flex-col gap-1.5'>
                    <Label>Select Option</Label>
                    <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
                      <SelectTrigger>
                        <SelectValue placeholder='Choose an option' />
                      </SelectTrigger>
                      <SelectContent>
                        {(linkDialog?.spec.options ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    className='self-start px-0 text-[12px]'
                    onClick={() => setShowNewOption(true)}
                  >
                    <Plus className='size-3' />
                    Create new option
                  </Button>
                </>
              ) : (
                <>
                  <div className='flex flex-col gap-1.5'>
                    <Label htmlFor='new-opt-value'>New Option Value</Label>
                    <Input
                      id='new-opt-value'
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      placeholder='e.g. Red, Large'
                      required
                      autoFocus
                    />
                  </div>
                  {linkDialog?.spec.display_type === 'swatch' && (
                    <div className='flex flex-col gap-1.5'>
                      <Label htmlFor='new-opt-color'>Color Hex</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          id='new-opt-color'
                          value={newOptionColorHex}
                          onChange={(e) => setNewOptionColorHex(e.target.value)}
                          placeholder='#FF0000'
                        />
                        {newOptionColorHex && (
                          <div
                            className='size-8 rounded-md border border-border shrink-0'
                            style={{ backgroundColor: newOptionColorHex }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  <Button
                    type='button'
                    variant='link'
                    size='sm'
                    className='self-start px-0 text-[12px]'
                    onClick={() => setShowNewOption(false)}
                  >
                    Pick existing option instead
                  </Button>
                </>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setLinkDialog(null)
                  resetLinkForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                isPending={linkMutation.isPending || createOptionAndLinkMutation.isPending}
                disabled={!showNewOption && !selectedOptionId}
              >
                {showNewOption ? 'Create & Link' : 'Link Option'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
