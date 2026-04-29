import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import { VPHeader } from './-components/vp-header'
import { VariantsTable } from './-components/variants-table'
import { SpecsBar } from './-components/specs-bar'
import { ImageStrip } from '@/routes/_authenticated/catalog/-components/image-strip'
import { MetaEditor } from '@/components/common/meta-editor'
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
  const params = Route.useParams()
  const vpId = (params as Record<string, string>).vpId
  const navigate = useNavigate()
  const router = useRouter()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addProductsOpen, setAddProductsOpen] = useState(false)

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
        onBack={() => router.history.back()}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <div className='flex-1 overflow-y-auto'>
        {/* ── Top bar: images + meta in a compact strip ── */}
        <div className={cn('flex flex-col gap-3 border-b border-border py-3', isMobile ? 'px-3.5' : 'px-5')}>
          <div className='flex items-center gap-4'>
            <ImageStrip
              entityType='vp'
              entityId={vp.id}
              projectId={projectId}
              label={`${vp.name} — Images`}
              className='flex-1'
            />
            {vp.slug && (
              <span className='shrink-0 rounded-md bg-bg-secondary px-2 py-0.5 font-mono text-[11px] text-text-quaternary'>
                {vp.slug}
              </span>
            )}
          </div>
          <MetaEditor
            entityType='vp'
            entityId={vp.id}
            projectId={projectId}
            initialTitle={(vp as Record<string, string>).meta_title}
            initialDescription={(vp as Record<string, string>).meta_description}
          />
        </div>

        {/* ── Main content ── */}
        <div className={cn('flex flex-col gap-5', isMobile ? 'p-3.5' : 'p-5')}>
          {/* Specs + Variants unified header */}
          <SpecsBar vp={vp} projectId={projectId} onAddProducts={() => setAddProductsOpen(true)} />

          {/* Variants table */}
          <VariantsTable vp={vp} projectId={projectId} addProductsOpen={addProductsOpen} onAddProductsChange={setAddProductsOpen} />

          {/* Danger zone — compact */}
          <div className='flex items-center gap-3 rounded-lg border border-destructive/20 px-4 py-3'>
            <div className='min-w-0 flex-1'>
              <span className='text-[13px] font-medium text-destructive'>Delete this superinventory</span>
              <span className='ml-2 text-[11px] text-text-tertiary'>Permanently removes all items, specs, and values</span>
            </div>
            <Button variant='destructive' size='sm' className='shrink-0' onClick={() => setDeleteOpen(true)}>
              <Trash2 className='size-3.5' />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Superinventory</DialogTitle>
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
    meta: [{ title: 'Superinventory' }],
  }),
})
