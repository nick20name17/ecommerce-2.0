import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { VPHeader } from '@/routes/_authenticated/variable-products/$vpId/-components/vp-header'
import { VPItemsSection } from '@/routes/_authenticated/variable-products/$vpId/-components/vp-items-section'
import { VPSpecsSection } from '@/routes/_authenticated/variable-products/$vpId/-components/vp-specs-section'
import { VPValuesMatrix } from '@/routes/_authenticated/variable-products/$vpId/-components/vp-values-matrix'
import { VP_QUERY_KEYS, getVariableProductDetailQuery } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

const CatalogVPDetailPage = () => {
  const { vpId } = Route.useParams()
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: vp, isLoading } = useQuery(
    getVariableProductDetailQuery(vpId, { project_id: projectId ?? undefined })
  )

  const deleteMutation = useMutation({
    mutationFn: () =>
      variableProductService.delete(vpId, { project_id: projectId ?? undefined }),
    meta: {
      successMessage: 'Variable product deleted',
      invalidatesQuery: VP_QUERY_KEYS.lists(),
    },
    onSuccess: () => navigate({ to: '/catalog' }),
  })

  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <div className={cn('flex items-center gap-3 border-b border-border py-3', isMobile ? 'px-3.5' : 'px-6')}>
          <Skeleton className='h-7 w-7 rounded-md' />
          <Skeleton className='h-5 w-48 rounded' />
        </div>
        <div className={cn('flex-1', isMobile ? 'p-3.5' : 'p-6')}>
          <div className='flex flex-col gap-6'>
            <Skeleton className='h-32 w-full rounded-lg' />
            <Skeleton className='h-24 w-full rounded-lg' />
            <Skeleton className='h-48 w-full rounded-lg' />
          </div>
        </div>
      </div>
    )
  }

  if (!vp) {
    return (
      <div className='flex h-full items-center justify-center text-[13px] text-text-tertiary'>
        Variable product not found
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <VPHeader
        vp={vp}
        projectId={projectId}
        onBack={() => navigate({ to: '/catalog' })}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <div className='flex-1 overflow-y-auto'>
        <div className={cn('flex flex-col gap-6', isMobile ? 'p-3.5' : isTablet ? 'p-5' : 'p-6')}>
          {/* Meta info */}
          <div className='flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-tertiary'>
            {vp.slug && (
              <div>
                <span className='font-medium text-text-secondary'>Slug:</span> {vp.slug}
              </div>
            )}
            {vp.category_id && (
              <div>
                <span className='font-medium text-text-secondary'>Category:</span>{' '}
                {vp.category_id}
              </div>
            )}
            {vp.image_url && (
              <div>
                <span className='font-medium text-text-secondary'>Image:</span>{' '}
                <a
                  href={vp.image_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  View
                </a>
              </div>
            )}
          </div>

          {/* Items */}
          <VPItemsSection vp={vp} projectId={projectId} isMobile={isMobile} isTablet={isTablet} />

          {/* Specs */}
          <VPSpecsSection vp={vp} projectId={projectId} />

          {/* Values Matrix */}
          <VPValuesMatrix vp={vp} projectId={projectId} isMobile={isMobile} isTablet={isTablet} />

          {/* Danger zone */}
          <div className='rounded-lg border border-destructive/20 p-4'>
            <div className={cn('flex gap-3', isMobile ? 'flex-col' : 'items-center justify-between')}>
              <div>
                <h3 className='text-[13px] font-semibold text-destructive'>Delete Variable Product</h3>
                <p className='text-[12px] text-text-tertiary mt-0.5'>
                  This will permanently delete all items, specs, and values.
                </p>
              </div>
              <Button variant='destructive' size='sm' className={cn('shrink-0', isMobile ? 'self-stretch' : 'self-start')} onClick={() => setDeleteOpen(true)}>
                <Trash2 className='size-3.5' />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Variable Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{vp.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => deleteMutation.mutate()}
              isPending={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/catalog/vp/$vpId/')({
  component: CatalogVPDetailPage,
  head: () => ({
    meta: [{ title: 'Variable Product' }],
  }),
})
