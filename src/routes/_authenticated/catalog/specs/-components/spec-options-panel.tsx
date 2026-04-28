import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { getSpecOptionsQuery, VP_QUERY_KEYS } from '@/api/variable-product/query'
import type { GlobalSpecDefinition, SpecOption } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
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
import { Skeleton } from '@/components/ui/skeleton'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'

interface SpecOptionsPanelProps {
  spec: GlobalSpecDefinition
  projectId: number | null
}

export const SpecOptionsPanel = ({ spec, projectId }: SpecOptionsPanelProps) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const [createOpen, setCreateOpen] = useState(false)
  const [editOption, setEditOption] = useState<SpecOption | null>(null)
  const [deleteOption, setDeleteOption] = useState<SpecOption | null>(null)

  // Form
  const [formValue, setFormValue] = useState('')
  const [formColor, setFormColor] = useState('')
  const [formSort, setFormSort] = useState(0)

  const { data: rawData, isLoading } = useQuery(getSpecOptionsQuery(spec.id, params))
  const options: SpecOption[] = Array.isArray(rawData) ? rawData : (rawData as unknown as { results?: SpecOption[] })?.results ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specOptions(spec.id) })
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specs() })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpecOption(spec.id, {
        value: formValue,
        color_hex: formColor || undefined,
        sort_order: formSort,
      }, params),
    meta: { successMessage: 'Option created' },
    onSuccess: () => { invalidate(); setCreateOpen(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      variableProductService.updateSpecOption(spec.id, editOption!.id, {
        value: formValue,
        color_hex: formColor || undefined,
        sort_order: formSort,
      }, params),
    meta: { successMessage: 'Option updated' },
    onSuccess: () => { invalidate(); setEditOption(null); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      variableProductService.deleteSpecOption(spec.id, deleteOption!.id, params),
    meta: { successMessage: 'Option deleted' },
    onSuccess: () => { invalidate(); setDeleteOption(null) },
  })

  const resetForm = () => {
    setFormValue('')
    setFormColor('')
    setFormSort(0)
  }

  const openEdit = (opt: SpecOption) => {
    setFormValue(opt.value)
    setFormColor(opt.color_hex || '')
    setFormSort(opt.sort_order)
    setEditOption(opt)
  }

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Panel header */}
      <div className='flex shrink-0 items-center gap-3 border-b border-border px-6 py-3'>
        <div className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold uppercase',
          spec.display_type === 'swatch' ? 'bg-pink-500/10 text-pink-500'
            : spec.display_type === 'button' ? 'bg-blue-500/10 text-blue-500'
            : 'bg-amber-500/10 text-amber-500'
        )}>
          {spec.display_type === 'swatch' ? '🎨' : spec.display_type === 'button' ? 'Btn' : '▾'}
        </div>
        <div className='min-w-0 flex-1'>
          <h2 className='text-[14px] font-semibold'>{spec.name}</h2>
          <p className='text-[11px] text-text-tertiary'>
            {spec.display_type} · {options.length} option{options.length !== 1 ? 's' : ''}
            {(spec.vp_count ?? 0) > 0 && ` · used by ${spec.vp_count} superinventory items`}
          </p>
        </div>
        <Button size='sm' onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className='size-3.5' />
          Add Option
        </Button>
      </div>

      {/* Options list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex flex-col gap-1 p-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full rounded-lg' />
            ))}
          </div>
        ) : options.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-12 text-center'>
            <p className='text-[13px] text-text-tertiary'>No options yet</p>
            <Button variant='outline' size='sm' onClick={() => { resetForm(); setCreateOpen(true) }}>
              <Plus className='size-3.5' />
              Add first option
            </Button>
          </div>
        ) : (
          <div className='flex flex-col'>
            {options.map((opt) => (
              <div
                key={opt.id}
                className='group flex items-center gap-3 border-b border-border-light px-6 py-2.5 transition-colors hover:bg-bg-hover'
              >
                {/* Swatch preview */}
                {spec.display_type === 'swatch' && (
                  <div
                    className='size-6 shrink-0 rounded-full border border-border'
                    style={{ backgroundColor: opt.color_hex || '#ccc' }}
                  />
                )}

                <div className='min-w-0 flex-1'>
                  <span className='text-[13px] font-medium text-foreground'>{opt.value}</span>
                  {opt.color_hex && (
                    <span className='ml-2 font-mono text-[11px] text-text-quaternary'>{opt.color_hex}</span>
                  )}
                </div>

                <span className='text-[11px] tabular-nums text-text-quaternary'>#{opt.sort_order}</span>

                <div className='flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
                  <Button variant='ghost' size='icon-xs' onClick={() => openEdit(opt)}>
                    <Pencil className='size-3' />
                  </Button>
                  <Button variant='ghost' size='icon-xs' className='hover:text-destructive' onClick={() => setDeleteOption(opt)}>
                    <Trash2 className='size-3' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create/Edit Option Dialog ── */}
      <Dialog
        open={createOpen || !!editOption}
        onOpenChange={(v) => { if (!v) { setCreateOpen(false); setEditOption(null) } }}
      >
        <DialogContent className='sm:max-w-xs'>
          <form onSubmit={(e) => { e.preventDefault(); editOption ? updateMutation.mutate() : createMutation.mutate() }}>
            <DialogHeader>
              <DialogTitle>{editOption ? 'Edit Option' : 'New Option'}</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-[12px]'>Value</Label>
                <Input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder='e.g. Red, Large, Cotton' required autoFocus />
              </div>
              {spec.display_type === 'swatch' && (
                <div className='flex flex-col gap-2'>
                  <Label className='text-[12px]'>Color</Label>
                  <div className='rounded-xl border border-border'>
                    <div className='p-2 [&_.react-colorful]:!w-full [&_.react-colorful]:!h-[140px] [&_.react-colorful]:rounded-lg [&_.react-colorful\_\_saturation]:!rounded-t-lg [&_.react-colorful\_\_hue]:!rounded-b-lg [&_.react-colorful\_\_pointer]:!h-5 [&_.react-colorful\_\_pointer]:!w-5'>
                      <HexColorPicker
                        color={formColor || '#3B82F6'}
                        onChange={setFormColor}
                      />
                    </div>
                    <div className='flex items-center gap-2 border-t border-border bg-bg-secondary/40 px-3 py-2'>
                      <div
                        className='size-6 shrink-0 rounded-md border border-border'
                        style={{ backgroundColor: formColor || '#3B82F6' }}
                      />
                      <input
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        placeholder='#3B82F6'
                        className='flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-text-quaternary'
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => { setCreateOpen(false); setEditOption(null) }}>Cancel</Button>
              <Button type='submit' isPending={editOption ? updateMutation.isPending : createMutation.isPending}>
                {editOption ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Option Confirmation ── */}
      <Dialog open={!!deleteOption} onOpenChange={(v) => !v && setDeleteOption(null)}>
        <DialogContent className='sm:max-w-xs'>
          <DialogHeader>
            <DialogTitle>Delete "{deleteOption?.value}"?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOption(null)}>Cancel</Button>
            <Button variant='destructive' onClick={() => deleteMutation.mutate()} isPending={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
