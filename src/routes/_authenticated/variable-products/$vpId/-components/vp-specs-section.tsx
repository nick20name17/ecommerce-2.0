import { useMutation } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type {
  GlobalSpecDefinition,
  SpecDisplayType,
  VariableProduct,
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
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
const DISPLAY_TYPES: { value: SpecDisplayType; label: string }[] = [
  { value: 'swatch', label: 'Swatch (Color circles)' },
  { value: 'dropdown', label: 'Dropdown (Select menu)' },
  { value: 'button', label: 'Button (Toggle group)' },
]

interface VPSpecsSectionProps {
  vp: VariableProduct
  projectId: number | null
}

export const VPSpecsSection = ({ vp, projectId }: VPSpecsSectionProps) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editSpec, setEditSpec] = useState<GlobalSpecDefinition | null>(null)
  const [deleteSpec, setDeleteSpec] = useState<GlobalSpecDefinition | null>(null)
  const [specName, setSpecName] = useState('')
  const [displayType, setDisplayType] = useState<SpecDisplayType>('dropdown')
  const [sortOrder, setSortOrder] = useState(0)

  const addSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpec(
        { name: specName, display_type: displayType, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Spec created',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetForm()
      setAddOpen(false)
    },
  })

  const updateSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.updateSpec(
        editSpec!.id,
        { name: specName, display_type: displayType, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Spec updated',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetForm()
      setEditSpec(null)
    },
  })

  const deleteSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.deleteSpec(deleteSpec!.id, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Spec deleted',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => setDeleteSpec(null),
  })

  const resetForm = () => {
    setSpecName('')
    setDisplayType('dropdown')
    setSortOrder(0)
  }

  const openEdit = (spec: GlobalSpecDefinition) => {
    setSpecName(spec.name)
    setDisplayType(spec.display_type)
    setSortOrder(spec.sort_order)
    setEditSpec(spec)
  }

  const isFormOpen = addOpen || !!editSpec
  const isPending = addSpecMutation.isPending || updateSpecMutation.isPending

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>
          Specs ({vp.spec_definitions.length})
        </h3>
        <div className='flex-1' />
        <Button variant='outline' size='xs' onClick={() => { resetForm(); setAddOpen(true) }}>
          <Plus className='size-3' />
          Add Spec
        </Button>
      </div>

      {vp.spec_definitions.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-text-tertiary'>
          No spec definitions yet
        </div>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {vp.spec_definitions.map((spec) => (
            <div
              key={spec.id}
              className='group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2'
            >
              <div>
                <div className='text-[13px] font-medium'>{spec.name}</div>
                <div className='text-[11px] text-text-tertiary capitalize'>
                  {spec.display_type} · {spec.options?.length ?? 0} options
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    className='sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
                  >
                    <MoreHorizontal className='size-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-36'>
                  <DropdownMenuItem onClick={() => openEdit(spec)}>
                    <Pencil className='size-3.5' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => setDeleteSpec(spec)}
                  >
                    <Trash2 className='size-3.5' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false)
            setEditSpec(null)
            resetForm()
          }
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editSpec) {
                updateSpecMutation.mutate()
              } else {
                addSpecMutation.mutate()
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{editSpec ? 'Edit Spec' : 'New Spec'}</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-name'>Name</Label>
                <Input
                  id='spec-name'
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  placeholder='e.g. Color, Size'
                  required
                  autoFocus
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Display Type</Label>
                <Select
                  value={displayType}
                  onValueChange={(v) => setDisplayType(v as SpecDisplayType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPLAY_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-sort'>Sort Order</Label>
                <Input
                  id='spec-sort'
                  type='number'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setAddOpen(false)
                  setEditSpec(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type='submit' isPending={isPending}>
                {editSpec ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteSpec} onOpenChange={(v) => !v && setDeleteSpec(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Spec</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteSpec?.name}</strong>? This will also delete all its options and item links.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteSpec(null)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => deleteSpecMutation.mutate()}
              isPending={deleteSpecMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
