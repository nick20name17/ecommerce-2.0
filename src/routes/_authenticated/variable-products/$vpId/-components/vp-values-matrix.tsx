import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type {
  VariableProduct,
  VariableProductItem,
  VariableProductSpec,
  VariableProductSpecValue,
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
  const [addValueDialog, setAddValueDialog] = useState<{
    spec: VariableProductSpec
    itemId?: string
  } | null>(null)

  const [value, setValue] = useState('')
  const [colorHex, setColorHex] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [hoverText, setHoverText] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [valueSortOrder, setValueSortOrder] = useState(0)

  const addValueMutation = useMutation({
    mutationFn: () =>
      variableProductService.addSpecValue(
        vp.id,
        addValueDialog!.spec.id,
        {
          item_id: selectedItemId || addValueDialog!.itemId!,
          value,
          color_hex: colorHex || undefined,
          image_url: imageUrl || undefined,
          hover_text: hoverText || undefined,
          sort_order: valueSortOrder,
        },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Value added',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetValueForm()
      setAddValueDialog(null)
    },
  })

  const deleteValueMutation = useMutation({
    mutationFn: ({ specId, valueId }: { specId: string; valueId: string }) =>
      variableProductService.deleteSpecValue(vp.id, specId, valueId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Value removed',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
  })

  const resetValueForm = () => {
    setValue('')
    setColorHex('')
    setImageUrl('')
    setHoverText('')
    setSelectedItemId('')
    setValueSortOrder(0)
  }

  if (vp.items.length === 0 || vp.specs.length === 0) {
    return (
      <div>
        <h3 className='text-[13px] font-semibold text-text-secondary mb-2'>Values Matrix</h3>
        <div className='rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-text-tertiary'>
          {vp.items.length === 0
            ? 'Add items first to define spec values'
            : 'Add specs first to define values'}
        </div>
      </div>
    )
  }

  // Build the matrix: rows = items, columns = specs
  const getValueForCell = (
    item: VariableProductItem,
    spec: VariableProductSpec
  ): VariableProductSpecValue | undefined => {
    return spec.values.find((v) => v.item_id === item.id)
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
              {vp.specs.map((spec) => (
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
                {vp.specs.map((spec) => {
                  const val = getValueForCell(item, spec)
                  return (
                    <td key={spec.id} className={cn('py-1.5 whitespace-nowrap', isMobile ? 'px-2' : isTablet ? 'px-2.5' : 'px-3')}>
                      {val ? (
                        <div className='flex items-center gap-1.5 group'>
                          {spec.display_type === 'swatch' && val.color_hex && (
                            <div
                              className='size-4 rounded-full border border-border shrink-0'
                              style={{ backgroundColor: val.color_hex }}
                            />
                          )}
                          <span>{val.value}</span>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            className='sm:opacity-0 sm:group-hover:opacity-100 text-text-tertiary hover:text-destructive shrink-0'
                            onClick={() =>
                              deleteValueMutation.mutate({
                                specId: spec.id,
                                valueId: val.id,
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
                            resetValueForm()
                            setSelectedItemId(item.id)
                            setAddValueDialog({ spec, itemId: item.id })
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

      {/* Add value dialog */}
      <Dialog
        open={!!addValueDialog}
        onOpenChange={(v) => {
          if (!v) {
            setAddValueDialog(null)
            resetValueForm()
          }
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addValueMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Set {addValueDialog?.spec.name} Value
              </DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              {!addValueDialog?.itemId && (
                <div className='flex flex-col gap-1.5'>
                  <Label>Item</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select an item' />
                    </SelectTrigger>
                    <SelectContent>
                      {vp.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.descr_1 || item.product_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sv-value'>Value</Label>
                <Input
                  id='sv-value'
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='e.g. Red, Large'
                  required
                  autoFocus
                />
              </div>
              {addValueDialog?.spec.display_type === 'swatch' && (
                <div className='flex flex-col gap-1.5'>
                  <Label htmlFor='sv-color'>Color Hex</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='sv-color'
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      placeholder='#FF0000'
                    />
                    {colorHex && (
                      <div
                        className='size-8 rounded-md border border-border shrink-0'
                        style={{ backgroundColor: colorHex }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sv-image'>Image URL</Label>
                <Input
                  id='sv-image'
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder='https://...'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sv-hover'>Hover Text</Label>
                <Input
                  id='sv-hover'
                  value={hoverText}
                  onChange={(e) => setHoverText(e.target.value)}
                  placeholder='Tooltip text'
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='sv-sort'>Sort Order</Label>
                <Input
                  id='sv-sort'
                  type='number'
                  value={valueSortOrder}
                  onChange={(e) => setValueSortOrder(Number(e.target.value))}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setAddValueDialog(null)
                  resetValueForm()
                }}
              >
                Cancel
              </Button>
              <Button type='submit' isPending={addValueMutation.isPending}>
                Set Value
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
