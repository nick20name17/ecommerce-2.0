import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Box,
  Eye,
  EyeOff,
  FolderPlus,
  Layers,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

import { CATALOG_QUERY_KEYS, getCatalogDetailQuery } from '@/api/catalog/query'
import type { CatalogCategory, CatalogCategoryProduct, CatalogCategoryVP } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { ImageGallery } from '@/components/common/image-gallery'
import { MetaTagsEditor } from '@/components/common/meta-tags-editor'
import { StatusBadge, StatusEditor, type StatusValue } from '@/components/common/status-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { AddItemDialog } from './add-item-dialog'
import { ImageStrip } from './image-strip'

interface CategoryItemsPanelProps {
  category: CatalogCategory
  projectId: number | null
  isMobile?: boolean
  onAddSubcategory: () => void
}

export const CategoryItemsPanel = ({
  category,
  projectId,
  isMobile,
  onAddSubcategory,
}: CategoryItemsPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [addVPOpen, setAddVPOpen] = useState(false)

  const { data, isLoading } = useQuery(
    getCatalogDetailQuery(category.id, {
      project_id: projectId ?? undefined,
    })
  )

  const detail = data
  const products = detail?.products ?? []
  const vps = detail?.variable_products ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.detail(category.id) })
    queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.trees() })
  }

  const removeProductMutation = useMutation({
    mutationFn: (recordId: string) =>
      catalogService.removeProduct(category.id, recordId, {
        project_id: projectId ?? undefined,
      }),
    meta: { successMessage: 'Product removed' },
    onSuccess: invalidate,
  })

  const toggleProductMutation = useMutation({
    mutationFn: ({ recordId, active }: { recordId: string; active: boolean }) =>
      catalogService.updateProduct(category.id, recordId, { active }, {
        project_id: projectId ?? undefined,
      }),
    onSuccess: invalidate,
  })

  const removeVPMutation = useMutation({
    mutationFn: (recordId: string) =>
      catalogService.removeVariableProduct(category.id, recordId, {
        project_id: projectId ?? undefined,
      }),
    meta: { successMessage: 'Superinventory removed' },
    onSuccess: invalidate,
  })

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', isMobile ? 'px-3.5' : 'px-6')}>
      {/* Category header */}
      <div className='shrink-0 py-4 border-b border-border'>
        <div className='flex items-center gap-2 mb-2'>
          <h2 className='text-[15px] font-semibold tracking-[-0.01em]'>
            {category.name}
          </h2>
          {!category.active && (
            <span className='rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-tertiary'>
              Inactive
            </span>
          )}
        </div>

        {/* Meta tags */}
        <MetaTagsEditor
          entityType='category'
          entityId={category.id}
          projectId={projectId}
        />

        {/* Images */}
        <div className='mt-3'>
          <ImageStrip
            entityType='category'
            entityId={category.id}
            projectId={projectId}
            label={`${category.name} Images`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className='shrink-0 flex items-center gap-1.5 py-2 border-b border-border'>
        <Button size='xs' variant='outline' onClick={() => setAddProductOpen(true)}>
          <Plus className='size-3' />
          Product
        </Button>
        <Button size='xs' variant='outline' onClick={() => setAddVPOpen(true)}>
          <Layers className='size-3' />
          Superinventory
        </Button>
        <Button size='xs' variant='outline' onClick={onAddSubcategory}>
          <FolderPlus className='size-3' />
          Subcategory
        </Button>
      </div>

      {/* Items list */}
      <div className='flex-1 overflow-y-auto py-2'>
        {isLoading ? (
          <div className='flex flex-col gap-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-14 rounded-lg' />
            ))}
          </div>
        ) : products.length === 0 && vps.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-text-quaternary'>
            <Package className='size-8 mb-2' />
            <p className='text-[13px]'>No items in this category</p>
            <p className='text-[11px] mt-1'>
              Add products or drag them from the unassigned panel
            </p>
          </div>
        ) : (
          <div className='flex flex-col gap-1'>
            {/* Variable Products */}
            {vps.map((vp) => (
              <VPRow
                key={vp.id}
                vp={vp}
                projectId={projectId}
                onRemove={() => removeVPMutation.mutate(vp.id)}
                onNavigate={() =>
                  navigate({
                    to: '/catalog/vp/$vpId',
                    params: { vpId: vp.vp_id },
                    search: { project_id: projectId ?? undefined },
                  })
                }
              />
            ))}

            {/* Standalone Products */}
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categoryId={category.id}
                projectId={projectId}
                onInvalidate={invalidate}
                onRemove={() => removeProductMutation.mutate(product.id)}
                onToggleActive={() =>
                  toggleProductMutation.mutate({
                    recordId: product.id,
                    active: !product.active,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <AddItemDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        categoryId={category.id}
        itemType='product'
        projectId={projectId}
      />
      <AddItemDialog
        open={addVPOpen}
        onOpenChange={setAddVPOpen}
        categoryId={category.id}
        itemType='variable_product'
        projectId={projectId}
      />
    </div>
  )
}

// ── VP Row ───────────────────────────────────────────────────

function VPRow({
  vp,
  projectId,
  onRemove,
  onNavigate,
}: {
  vp: CatalogCategoryVP
  projectId: number | null
  onRemove: () => void
  onNavigate: () => void
}) {
  return (
    <div className='group flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-bg-secondary transition-colors'>
      <button
        type='button'
        className='flex flex-1 items-center gap-2 min-w-0 text-left'
        onClick={onNavigate}
      >
        <div className='flex size-8 shrink-0 items-center justify-center rounded bg-purple-500/10'>
          <Layers className='size-3.5 text-purple-500' />
        </div>
        <div className='min-w-0'>
          <p className='text-[13px] font-medium truncate'>
            {vp.name || vp.vp_id}
          </p>
          {vp.slug && (
            <p className='text-[11px] text-text-quaternary truncate'>{vp.slug}</p>
          )}
        </div>
        <span className='shrink-0 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-500'>
          SUPER
        </span>
      </button>
      <Button
        variant='ghost'
        size='icon-xs'
        className='opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground'
        onClick={onRemove}
        title='Remove from category'
      >
        <Trash2 className='size-3' />
      </Button>
    </div>
  )
}

// ── Product Row ──────────────────────────────────────────────

function ProductRow({
  product,
  categoryId,
  projectId,
  onInvalidate,
  onRemove,
  onToggleActive,
}: {
  product: CatalogCategoryProduct
  categoryId: string
  projectId: number | null
  onInvalidate: () => void
  onRemove: () => void
  onToggleActive: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [status, setStatus] = useState<StatusValue>(product.status ?? '')
  const [statusExpiresAt, setStatusExpiresAt] = useState<string | null>(
    product.status_expires_at ?? null
  )

  const updateMutation = useMutation({
    mutationFn: () =>
      catalogService.updateProduct(
        categoryId,
        product.id,
        { status, status_expires_at: statusExpiresAt },
        { project_id: projectId ?? undefined }
      ),
    meta: { successMessage: 'Status updated' },
    onSuccess: () => {
      onInvalidate()
      setEditOpen(false)
    },
  })

  return (
    <>
      <div className='group flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-bg-secondary transition-colors'>
        <div className='flex size-8 shrink-0 items-center justify-center rounded bg-blue-500/10'>
          <Box className='size-3.5 text-blue-500' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className={cn('text-[13px] font-medium truncate', !product.active && 'text-text-tertiary')}>
            {product.descr_1 || product.product_id || product.product_autoid}
          </p>
          {product.product_id && (
            <p className='text-[11px] text-text-quaternary truncate'>{product.product_id}</p>
          )}
        </div>
        <StatusBadge status={product.status} expiresAt={product.status_expires_at} />
        <Button
          variant='ghost'
          size='icon-xs'
          className='opacity-0 group-hover:opacity-100'
          onClick={() => {
            setStatus(product.status ?? '')
            setStatusExpiresAt(product.status_expires_at ?? null)
            setEditOpen(true)
          }}
          title='Edit status'
        >
          <Pencil className='size-3' />
        </Button>
        <Button
          variant='ghost'
          size='icon-xs'
          className='opacity-0 group-hover:opacity-100'
          onClick={onToggleActive}
          title={product.active ? 'Deactivate' : 'Activate'}
        >
          {product.active ? <Eye className='size-3' /> : <EyeOff className='size-3 text-text-quaternary' />}
        </Button>
        <Button
          variant='ghost'
          size='icon-xs'
          className='opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground'
          onClick={onRemove}
          title='Remove from category'
        >
          <Trash2 className='size-3' />
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Status</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <p className='text-[12px] text-text-tertiary'>
                {product.descr_1 || product.product_id || product.product_autoid}
              </p>
              <StatusEditor
                status={status}
                expiresAt={statusExpiresAt}
                onStatusChange={setStatus}
                onExpiresAtChange={setStatusExpiresAt}
              />
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' isPending={updateMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
