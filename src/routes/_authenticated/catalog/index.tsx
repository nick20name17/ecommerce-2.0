import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, FolderTree, Plus } from 'lucide-react'
import { useState } from 'react'

import { CategoryDeleteDialog } from './-components/category-delete-dialog'
import { CategoryFormDialog } from './-components/category-form-dialog'
import { CategoryItemsPanel } from './-components/category-items-panel'
import { CategoryTreeNode } from './-components/category-tree-node'
import { UnassignedProductsPanel } from './-components/unassigned-products-panel'
import { VPCreateDialog } from './-components/vp-create-dialog'
import { CATALOG_QUERY_KEYS, getCatalogTreeQuery } from '@/api/catalog/query'
import type { CatalogCategory } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { PageEmpty } from '@/components/common/page-empty'
import { ICatalog, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

const CatalogPage = () => {
  const [projectId] = useProjectId()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'

  const { data, isLoading } = useQuery(
    getCatalogTreeQuery({ project_id: projectId ?? undefined })
  )

  const tree = data?.results ?? []

  // Selection state — on mobile, selecting a category navigates to detail view
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const showDetail = isMobile && selectedCategory !== null

  // Dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CatalogCategory | null>(null)
  const [vpCreateOpen, setVpCreateOpen] = useState(false)
  const [showUnassigned, setShowUnassigned] = useState(false)

  const queryClient = useQueryClient()
  const moveMutation = useMutation({
    mutationFn: ({ categoryId, newParentId }: { categoryId: string; newParentId: string | null }) =>
      catalogService.update(categoryId, { parent_id: newParentId }, { project_id: projectId ?? undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.all() }),
  })

  const handleMove = (categoryId: string, newParentId: string | null) => {
    moveMutation.mutate({ categoryId, newParentId })
  }

  const openCreateDialog = (parentId: string | null = null) => {
    setEditingCategory(null)
    setParentIdForNew(parentId)
    setFormDialogOpen(true)
  }

  const openEditDialog = (category: CatalogCategory) => {
    setEditingCategory(category)
    setParentIdForNew(null)
    setFormDialogOpen(true)
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header
        className={cn(
          'border-border flex h-12 shrink-0 items-center gap-2 border-b',
          isMobile ? 'px-3.5' : 'px-6'
        )}
      >
        <SidebarTrigger className='-ml-1' />

        {isMobile && showDetail ? (
          <button
            type='button'
            className='flex items-center gap-1.5 text-[14px] font-semibold tracking-[-0.01em]'
            onClick={() => setSelectedCategory(null)}
          >
            <ArrowLeft className='size-4' />
            {selectedCategory?.name}
          </button>
        ) : (
          <div className='flex items-center gap-1.5'>
            <PageHeaderIcon icon={ICatalog} color={PAGE_COLORS.catalog} />
            <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Catalog</h1>
          </div>
        )}

        <div className='flex-1' />

        {!(isMobile && showDetail) && (
          <div className='flex items-center gap-1.5'>
            <Button
              size='sm'
              variant={showUnassigned ? 'default' : 'ghost'}
              onClick={() => {
                setShowUnassigned(!showUnassigned)
                if (!showUnassigned) setSelectedCategory(null)
              }}
            >
              <AlertCircle className='size-3.5' />
              <span className={cn(isMobile && 'hidden')}>Unassigned</span>
            </Button>

            <Button size='sm' onClick={() => openCreateDialog()}>
              <Plus className='size-3.5' />
              <span className={cn(isMobile && 'hidden')}>New Category</span>
            </Button>

            <Button size='sm' variant='outline' onClick={() => setVpCreateOpen(true)}>
              <Plus className='size-3.5' />
              <span className={cn(isMobile && 'hidden')}>New VP</span>
            </Button>
          </div>
        )}
      </header>

      {/* Content: tree + detail panel */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Tree sidebar — full width on mobile when no selection */}
        {(!isMobile || !showDetail) && (
          <div
            className={cn(
              'shrink-0 overflow-y-auto',
              isMobile
                ? 'w-full'
                : isTablet
                  ? 'w-[240px] border-r border-border'
                  : 'w-[320px] border-r border-border'
            )}
          >
            {isLoading ? (
              <div className={cn('flex flex-col gap-1 py-2', isMobile ? 'px-3.5' : 'px-1.5')}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={cn('w-full rounded-md', isMobile ? 'h-9' : 'h-8')} />
                ))}
              </div>
            ) : tree.length === 0 ? (
              <PageEmpty
                icon={FolderTree}
                title='No categories'
                description='Create a category or import from EBMS.'
                compact
                action={
                  <Button size='sm' onClick={() => openCreateDialog()}>
                    <Plus className='size-3.5' />
                    New Category
                  </Button>
                }
              />
            ) : (
              <div
                className='py-1 px-1.5 min-h-full'
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedId = e.dataTransfer.getData('text/plain')
                  if (draggedId) handleMove(draggedId, null)
                }}
              >
                {tree.map((cat) => (
                  <CategoryTreeNode
                    key={cat.id}
                    category={cat}
                    depth={0}
                    projectId={projectId}
                    selectedId={selectedCategory?.id ?? null}
                    onSelect={setSelectedCategory}
                    onEdit={openEditDialog}
                    onDelete={setDeleteCategory}
                    onAddChild={(parentId) => openCreateDialog(parentId)}
                    onMove={handleMove}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detail panel — full width on mobile when selected */}
        {(!isMobile || showDetail) && (
          <div className='flex-1 overflow-hidden'>
            {showUnassigned ? (
              <UnassignedProductsPanel projectId={projectId} isMobile={isMobile} />
            ) : selectedCategory ? (
              <CategoryItemsPanel
                category={selectedCategory}
                projectId={projectId}
                isMobile={isMobile}
              />
            ) : (
              !isMobile && (
                <div className='flex h-full items-center justify-center text-text-tertiary text-[13px]'>
                  Select a category to view its items
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={(v) => {
          setFormDialogOpen(v)
          if (!v) {
            setEditingCategory(null)
            setParentIdForNew(null)
          }
        }}
        category={editingCategory}
        parentId={parentIdForNew}
        projectId={projectId}
      />
      <CategoryDeleteDialog
        category={deleteCategory}
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        projectId={projectId}
        onDeleted={() => {
          if (selectedCategory?.id === deleteCategory?.id) {
            setSelectedCategory(null)
          }
        }}
      />

      <VPCreateDialog
        open={vpCreateOpen}
        onOpenChange={setVpCreateOpen}
        projectId={projectId}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/catalog/')({
  component: CatalogPage,
  head: () => ({
    meta: [{ title: 'Catalog' }],
  }),
})
