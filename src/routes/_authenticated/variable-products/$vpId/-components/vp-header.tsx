import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useReducer, useState } from 'react'

import type { VariableProduct, UpdateVariableProductPayload } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface VPHeaderProps {
  vp: VariableProduct
  projectId: number | null
  onBack: () => void
  isMobile?: boolean
  isTablet?: boolean
}

interface VPEditForm {
  name: string
  description: string
  slug: string
  imageUrl: string
}

export const VPHeader = ({ vp, projectId, onBack, isMobile, isTablet }: VPHeaderProps) => {
  const [editOpen, setEditOpen] = useState(false)
  const [form, patchForm] = useReducer(
    (state: VPEditForm, patch: Partial<VPEditForm>) => ({ ...state, ...patch }),
    { name: vp.name, description: vp.description, slug: vp.slug, imageUrl: vp.image_url }
  )

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateVariableProductPayload) =>
      variableProductService.update(vp.id, payload, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Variable product updated',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id)
    },
    onSuccess: () => setEditOpen(false)
  })

  const toggleActiveMutation = useMutation({
    mutationFn: () =>
      variableProductService.update(
        vp.id,
        { active: !vp.active },
        {
          project_id: projectId ?? undefined
        }
      ),
    meta: {
      successMessage: vp.active ? 'Deactivated' : 'Activated',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id)
    }
  })

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border py-3',
          isMobile ? 'px-3.5' : isTablet ? 'px-5' : 'px-6'
        )}
      >
        <Button variant='ghost' size='icon-sm' onClick={onBack}>
          <ArrowLeft className='size-4' />
        </Button>
        <div className='min-w-0 flex-1'>
          <h1
            className={cn(
              'truncate font-semibold tracking-[-0.01em]',
              isMobile ? 'text-[14px]' : 'text-[15px]'
            )}
          >
            {vp.name}
          </h1>
          {!isMobile && vp.description && (
            <p className='truncate text-[12px] text-text-tertiary'>{vp.description}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
            vp.active
              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
              : 'bg-muted text-text-tertiary hover:bg-muted/80'
          )}
          onClick={() => toggleActiveMutation.mutate()}
        >
          {vp.active ? 'Active' : 'Inactive'}
        </span>
        <Button
          variant='outline'
          size={isMobile ? 'icon-sm' : 'sm'}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className='size-3.5' />
          {!isMobile && 'Edit'}
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <form
            onSubmit={e => {
              e.preventDefault()
              updateMutation.mutate({
                name: form.name,
                description: form.description || undefined,
                slug: form.slug || undefined,
                image_url: form.imageUrl || undefined
              })
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Variable Product</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vp-edit-name'>Name</Label>
                <Input
                  id='vp-edit-name'
                  value={form.name}
                  onChange={e => patchForm({ name: e.target.value })}
                  required
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vp-edit-desc'>Description</Label>
                <Input
                  id='vp-edit-desc'
                  value={form.description}
                  onChange={e => patchForm({ description: e.target.value })}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vp-edit-slug'>Slug</Label>
                <Input
                  id='vp-edit-slug'
                  value={form.slug}
                  onChange={e => patchForm({ slug: e.target.value })}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='vp-edit-image'>Image URL</Label>
                <Input
                  id='vp-edit-image'
                  value={form.imageUrl}
                  onChange={e => patchForm({ imageUrl: e.target.value })}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' isPending={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
