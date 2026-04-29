import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  MoreHorizontal,
  Package,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { CATALOG_QUERY_KEYS, getCatalogDetailQuery } from '@/api/catalog/query'
import { VP_QUERY_KEYS, getVariableProductDetailQuery } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
import type { CatalogCategory, CatalogCategoryProduct, CatalogCategoryVP } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { PageEmpty } from '@/components/common/page-empty'
import { ProductThumbnail } from '@/components/common/product-thumbnail'
import { ProductBrowserDialog } from '@/components/common/product-browser-dialog'
import { VPCreateFromProductDialog } from './vp-create-from-product-dialog'
import { ImageStrip } from './image-strip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AddItemDialog } from './add-item-dialog'

// ── Types ────────────────────────────────────────────────────

type ItemTab = 'all' | 'products' | 'vps'

// No preview limit — grouped view is naturally compact

// ── Component ────────────────────────────────────────────────

interface CategoryItemsPanelProps {
  category: CatalogCategory
  projectId: number | null
  isMobile?: boolean
  onAddSubcategory?: () => void
}

export const CategoryItemsPanel = ({
  category,
  projectId,
  isMobile,
  onAddSubcategory,
}: CategoryItemsPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // UI state
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addItemType, setAddItemType] = useState<'product' | 'variable_product'>('product')
  const [productBrowserOpen, setProductBrowserOpen] = useState(false)
  const [createVPFromProduct, setCreateVPFromProduct] = useState<CatalogCategoryProduct | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ItemTab>('all')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [siPickerOpen, setSiPickerOpen] = useState(false)

  const toggleProductSelect = (autoid: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(autoid)) next.delete(autoid)
      else next.add(autoid)
      return next
    })
  }

  const clearSelection = () => setSelectedProductIds(new Set())

  // Reset states when category changes
  useEffect(() => {
    setExpandedProductId(null)
    setActiveTab('all')
    setSelectedProductIds(new Set())
  }, [category.id])

  // ── Data ─────────────────────────────────────────────────

  const { data, isLoading } = useQuery(
    getCatalogDetailQuery(category.id, { project_id: projectId ?? undefined })
  )

  const products = data?.products ?? []
  const variableProducts = data?.variable_products ?? []

  const hasItems = products.length > 0 || variableProducts.length > 0

  // ── Product → Superinventory mapping ─────────────────────

  const { productToVPId } = useQueries({
    queries: variableProducts.map((vp) =>
      getVariableProductDetailQuery(vp.vp_id, { project_id: projectId ?? undefined })
    ),
    combine: (results) => {
      const map = new Map<string, string>()
      for (const r of results) {
        const vp = r.data
        if (!vp) continue
        for (const item of vp.items ?? []) {
          map.set(item.product_autoid, vp.id)
        }
      }
      return { productToVPId: map }
    },
  })

  // Optimistic overrides: product autoids forced into a VP
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, string>>(new Map())

  // Build grouped view: SI groups (with their child products) + standalone products
  const { vpGroups, standaloneProducts } = useMemo(() => {
    const groups = new Map<string, { vp: CatalogCategoryVP; products: CatalogCategoryProduct[] }>()
    for (const vp of variableProducts) {
      groups.set(vp.vp_id, { vp, products: [] })
    }
    const standalone: CatalogCategoryProduct[] = []
    for (const p of products) {
      // Check optimistic moves first, then server mapping
      const optimisticVpId = optimisticMoves.get(p.product_autoid)
      const vpId = optimisticVpId || productToVPId.get(p.product_autoid)
      if (vpId && groups.has(vpId)) {
        groups.get(vpId)!.products.push(p)
      } else {
        standalone.push(p)
      }
    }
    return {
      vpGroups: [...groups.values()].sort((a, b) => a.vp.sort_order - b.vp.sort_order),
      standaloneProducts: standalone.sort((a, b) => a.sort_order - b.sort_order),
    }
  }, [products, variableProducts, productToVPId, optimisticMoves])

  const totalCount = products.length + variableProducts.length

  // ── Mutations ────────────────────────────────────────────

  const removeProductMutation = useMutation({
    mutationFn: (recordId: string) =>
      catalogService.removeProduct(category.id, recordId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Product removed',
      invalidatesQuery: CATALOG_QUERY_KEYS.detail(category.id),
    },
  })

  const toggleProductActiveMutation = useMutation({
    mutationFn: ({ recordId, active }: { recordId: string; active: boolean }) =>
      catalogService.updateProduct(category.id, recordId, { active }, {
        project_id: projectId ?? undefined,
      }),
    onMutate: async ({ recordId, active }) => {
      const queries = queryClient.getQueriesData<CatalogCategory>({
        queryKey: CATALOG_QUERY_KEYS.detail(category.id),
      })
      for (const [key, data] of queries) {
        if (data) {
          queryClient.setQueryData<CatalogCategory>(key, {
            ...data,
            products: data.products?.map((p) =>
              p.id === recordId ? { ...p, active } : p
            ),
          })
        }
      }
    },
  })

  const addProductsMutation = useMutation({
    mutationFn: async (products: { autoid: string }[]) => {
      const params = { project_id: projectId ?? undefined }
      for (const p of products) {
        await catalogService.addProduct(category.id, { product_autoid: p.autoid }, params)
      }
    },
    meta: {
      successMessage: 'Products added',
      invalidatesQuery: CATALOG_QUERY_KEYS.detail(category.id),
    },
  })

  const removeVPMutation = useMutation({
    mutationFn: (recordId: string) =>
      catalogService.removeVariableProduct(category.id, recordId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Variable product removed',
      invalidatesQuery: CATALOG_QUERY_KEYS.detail(category.id),
    },
  })

  const invalidateAfterMove = (vpId: string) => {
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vpId) })
    queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.detail(category.id) })
  }

  const addProductToVPMutation = useMutation({
    mutationFn: ({ vpId, productAutoid }: { vpId: string; productAutoid: string }) =>
      variableProductService.addItem(vpId, { product_autoid: productAutoid }, {
        project_id: projectId ?? undefined,
      }),
    onMutate: ({ vpId, productAutoid }) => {
      setOptimisticMoves((prev) => new Map(prev).set(productAutoid, vpId))
    },
    onSuccess: (_data, { vpId }) => invalidateAfterMove(vpId),
    onError: (_err, { productAutoid }) => {
      setOptimisticMoves((prev) => { const next = new Map(prev); next.delete(productAutoid); return next })
      invalidateAfterMove('')
    },
  })

  const bulkAddToVPMutation = useMutation({
    mutationFn: async ({ vpId, productAutoids }: { vpId: string; productAutoids: string[] }) => {
      const params = { project_id: projectId ?? undefined }
      // Parallel — all at once instead of sequential
      await Promise.all(
        productAutoids.map((autoid) =>
          variableProductService.addItem(vpId, { product_autoid: autoid }, params)
        )
      )
    },
    meta: { successMessage: 'Products added to superinventory' },
    onMutate: ({ vpId, productAutoids }) => {
      setOptimisticMoves((prev) => {
        const next = new Map(prev)
        for (const autoid of productAutoids) next.set(autoid, vpId)
        return next
      })
    },
    onSuccess: (_data, { vpId }) => {
      invalidateAfterMove(vpId)
      clearSelection()
      setOptimisticMoves(new Map())
    },
    onError: () => {
      setOptimisticMoves(new Map())
      queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.detail(category.id) })
    },
  })

  // ── Render ───────────────────────────────────────────────

  return (
    <div className='flex h-full flex-col'>
      {/* ── Header ── */}
      <div className={cn('flex items-center gap-2 border-b border-border py-3', isMobile ? 'px-3.5' : 'px-5')}>
        {!isMobile && (
          <h2 className='flex-1 truncate text-[14px] font-semibold tracking-[-0.01em]'>{category.name}</h2>
        )}
        {isMobile && <div className='flex-1' />}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' isPending={addProductsMutation.isPending}>
              <Plus className='size-3.5' />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={() => setProductBrowserOpen(true)}>
              <Package className='size-3.5' />
              Add products
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAddItemType('variable_product'); setAddItemOpen(true) }}>
              <Layers className='size-3.5' />
              Add superinventory
            </DropdownMenuItem>
            {onAddSubcategory && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onAddSubcategory}>
                  <Plus className='size-3.5' />
                  Add subcategory
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Image strip ── */}
      <div className={cn('border-b border-border py-2.5', isMobile ? 'px-3.5' : 'px-5')}>
        <ImageStrip
          entityType='category'
          entityId={category.id}
          projectId={projectId}
          label={`${category.name} — Images`}
        />
      </div>

      {/* ── Tab bar ── */}
      {hasItems && !isLoading && (
        <div className={cn('flex items-center gap-1 border-b border-border py-1.5', isMobile ? 'px-3.5' : 'px-5')}>
          {([
            { key: 'all' as const, label: 'All', count: totalCount },
            { key: 'vps' as const, label: 'Super Inventory', count: vpGroups.length },
            { key: 'products' as const, label: 'Standalone', count: standaloneProducts.length },
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              type='button'
              className={cn(
                'rounded-md px-2 py-1 text-[12px] font-medium transition-colors duration-75',
                activeTab === key
                  ? 'bg-bg-active text-foreground'
                  : 'text-text-tertiary hover:bg-bg-hover hover:text-text-secondary'
              )}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span className='ml-1 tabular-nums text-text-quaternary'>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Item list ── */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className={cn('flex flex-col gap-0.5 py-2', isMobile ? 'px-3.5' : 'px-5')}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3 py-2'>
                <Skeleton className='size-8 shrink-0 rounded-md' />
                <div className='flex-1'>
                  <Skeleton className={cn('mb-1 h-3.5 rounded', i % 2 === 0 ? 'w-32' : 'w-24')} />
                  <Skeleton className='h-3 w-20 rounded' />
                </div>
              </div>
            ))}
          </div>
        ) : !hasItems ? (
          <PageEmpty
            icon={Package}
            title='No items yet'
            description='Add products, superinventory items, or subcategories.'
            compact
            action={
              <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' onClick={() => setProductBrowserOpen(true)}>
                  <Plus className='size-3.5' />
                  Add products
                </Button>
                {onAddSubcategory && (
                  <Button variant='outline' size='sm' onClick={onAddSubcategory}>
                    <Plus className='size-3.5' />
                    Add subcategory
                  </Button>
                )}
              </div>
            }
          />
        ) : (
          <>
            {/* SI groups */}
            {(activeTab === 'all' || activeTab === 'vps') && vpGroups.map(({ vp, products: groupProducts }, i) => (
              <div key={vp.id} className='animate-fade-in-up' style={{ animationDelay: `${i * 0.04}s` }}>
                <SuperInventoryGroup
                  vp={vp}
                  products={groupProducts}
                  projectId={projectId}
                  isMobile={isMobile}
                  expandedProductId={expandedProductId}
                  onToggleProductExpand={(autoid) =>
                    setExpandedProductId(expandedProductId === autoid ? null : autoid)
                  }
                  onToggleProductActive={(p) =>
                    toggleProductActiveMutation.mutate({ recordId: p.id, active: !(p.active !== false) })
                  }
                  onCreateVPFromProduct={setCreateVPFromProduct}
                  onRemoveProduct={(p) => removeProductMutation.mutate(p.id)}
                  onNavigateToVP={() => navigate({ to: `/catalog/vp/${vp.vp_id}` })}
                  onRemoveVP={() => removeVPMutation.mutate(vp.id)}
                />
              </div>
            ))}

            {/* Standalone products */}
            {(activeTab === 'all' || activeTab === 'products') && standaloneProducts.map((p, i) => (
              <div key={p.id} className='animate-fade-in-up' style={{ animationDelay: `${(vpGroups.length + i) * 0.04}s` }}>
              <ProductRow
                product={p}
                projectId={projectId}
                isMobile={isMobile}
                isExpanded={expandedProductId === p.product_autoid}
                onToggleExpand={() =>
                  setExpandedProductId(expandedProductId === p.product_autoid ? null : p.product_autoid)
                }
                onToggleActive={() =>
                  toggleProductActiveMutation.mutate({ recordId: p.id, active: !(p.active !== false) })
                }
                onCreateVP={() => setCreateVPFromProduct(p)}
                onRemove={() => removeProductMutation.mutate(p.id)}
                availableVPs={variableProducts}
                onAddToVP={(vpId) => addProductToVPMutation.mutate({ vpId, productAutoid: p.product_autoid })}
                selected={selectedProductIds.has(p.product_autoid)}
                onToggleSelect={() => toggleProductSelect(p.product_autoid)}
              />
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Bulk action bar ── */}
      {selectedProductIds.size > 0 && (
        <div className={cn('flex shrink-0 items-center gap-2 border-t border-border bg-bg-secondary/80 py-2', isMobile ? 'px-3.5' : 'px-5')}>
          <span className='text-[12px] font-medium text-text-secondary tabular-nums'>
            {selectedProductIds.size} selected
          </span>
          <button
            type='button'
            className='text-[12px] text-text-tertiary hover:text-foreground transition-colors'
            onClick={clearSelection}
          >
            Clear
          </button>
          <div className='flex-1' />
          {variableProducts.length > 0 ? (
            <Button
              size='sm'
              isPending={bulkAddToVPMutation.isPending}
              onClick={() => setSiPickerOpen(true)}
            >
              <Layers className='size-3.5' />
              Add to superinventory
            </Button>
          ) : (
            <Button
              size='sm'
              onClick={() => {
                // Use first selected product to seed a new SI
                const firstAutoid = [...selectedProductIds][0]
                const firstProduct = standaloneProducts.find((p) => p.product_autoid === firstAutoid)
                if (firstProduct) setCreateVPFromProduct(firstProduct)
              }}
            >
              <Sparkles className='size-3.5' />
              Create superinventory
            </Button>
          )}
        </div>
      )}

      {/* ── SI Picker Dialog ── */}
      <Dialog open={siPickerOpen} onOpenChange={(v) => { if (!bulkAddToVPMutation.isPending) setSiPickerOpen(v) }}>
        <DialogContent className='sm:max-w-lg' onPointerDownOutside={(e) => { if (bulkAddToVPMutation.isPending) e.preventDefault() }}>
          {bulkAddToVPMutation.isPending ? (
            <>
              <DialogHeader>
                <DialogTitle>Adding products...</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className='flex flex-col items-center gap-4 py-8'>
                  <div className='size-10 animate-spin rounded-full border-2 border-border border-t-primary' />
                  <p className='text-[13px] text-text-tertiary'>
                    Adding {selectedProductIds.size} product{selectedProductIds.size !== 1 ? 's' : ''} to superinventory...
                  </p>
                </div>
              </DialogBody>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add to superinventory</DialogTitle>
              </DialogHeader>
              <DialogBody className='max-h-[60vh] overflow-y-auto'>
                {/* Selected products preview */}
                <div className='mb-3 flex items-center gap-2'>
                  <div className='flex -space-x-2'>
                    {[...selectedProductIds].slice(0, 4).map((autoid) => (
                      <ProductThumbnail
                        key={autoid}
                        entityType='product'
                        entityId={autoid}
                        projectId={projectId}
                        className='size-7 rounded-full border-2 border-background'
                      />
                    ))}
                  </div>
                  <span className='text-[12px] text-text-tertiary'>
                    {selectedProductIds.size} product{selectedProductIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>

                {/* Existing SIs */}
                <div className='flex flex-col gap-1.5'>
                  {variableProducts.map((vp) => {
                    const group = vpGroups.find((g) => g.vp.vp_id === vp.vp_id)
                    const itemCount = group?.products.length ?? 0
                    return (
                      <button
                        key={vp.vp_id}
                        type='button'
                        className='group/si flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors hover:bg-bg-hover'
                        onClick={() => {
                          bulkAddToVPMutation.mutate(
                            { vpId: vp.vp_id, productAutoids: [...selectedProductIds] },
                            { onSuccess: () => setSiPickerOpen(false) }
                          )
                        }}
                      >
                        <ProductThumbnail
                          entityType='vp'
                          entityId={vp.vp_id}
                          projectId={projectId}
                          className='size-10 shrink-0 rounded-lg'
                        />
                        <div className='min-w-0 flex-1'>
                          <span className='block truncate text-[13px] font-medium text-foreground'>
                            {vp.name || vp.vp_id}
                          </span>
                          <span className='text-[11px] text-text-tertiary'>
                            {itemCount} product{itemCount !== 1 ? 's' : ''} already
                          </span>
                        </div>
                        <span className='shrink-0 text-[12px] font-medium text-primary opacity-0 transition-opacity group-hover/si:opacity-100'>
                          Add →
                        </span>
                      </button>
                    )
                  })}

                  {/* Create new option */}
                  <button
                    type='button'
                    className='flex w-full items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-left transition-colors hover:border-purple-400 hover:bg-purple-500/[0.03]'
                    onClick={() => {
                      setSiPickerOpen(false)
                      const firstAutoid = [...selectedProductIds][0]
                      const firstProduct = standaloneProducts.find((p) => p.product_autoid === firstAutoid)
                      if (firstProduct) setCreateVPFromProduct(firstProduct)
                    }}
                  >
                    <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10'>
                      <Sparkles className='size-4 text-purple-500' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <span className='block text-[13px] font-medium text-foreground'>
                        Create new superinventory
                      </span>
                      <span className='text-[11px] text-text-tertiary'>
                        Group these products into a new one
                      </span>
                    </div>
                  </button>
                </div>
              </DialogBody>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialogs ── */}
      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        categoryId={category.id}
        itemType={addItemType}
        projectId={projectId}
      />

      <ProductBrowserDialog
        open={productBrowserOpen}
        onOpenChange={setProductBrowserOpen}
        projectId={projectId}
        title='Add Products to Category'
        onSelect={(products) => addProductsMutation.mutate(products)}
      />

      <VPCreateFromProductDialog
        product={createVPFromProduct}
        categoryId={category.id}
        open={!!createVPFromProduct}
        onOpenChange={(v) => !v && setCreateVPFromProduct(null)}
        projectId={projectId}
      />
    </div>
  )
}

// ── Product Row ──────────────────────────────────────────────

function ProductRow({
  product: p,
  projectId,
  isMobile,
  isExpanded,
  onToggleExpand,
  onToggleActive,
  onCreateVP,
  onRemove,
  onAddToVP,
  availableVPs,
  indent,
  selected,
  onToggleSelect,
}: {
  product: CatalogCategoryProduct
  projectId: number | null
  isMobile?: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleActive: () => void
  onCreateVP: () => void
  onRemove: () => void
  onAddToVP?: (vpId: string) => void
  availableVPs?: CatalogCategoryVP[]
  indent?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const isHidden = p.active === false

  return (
    <div className='border-b border-border-light'>
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-3 py-2 transition-colors hover:bg-bg-hover',
          isMobile ? 'px-3.5' : indent ? 'pl-12 pr-5' : 'px-5',
          isHidden && 'opacity-50'
        )}
        onClick={onToggleExpand}
      >
        {onToggleSelect && (
          <button
            type='button'
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
              selected
                ? 'border-primary bg-primary'
                : 'border-border hover:border-primary/50'
            )}
            onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
          >
            {selected && (
              <svg viewBox='0 0 12 12' className='size-2.5 text-primary-foreground' fill='none' stroke='currentColor' strokeWidth='2'>
                <polyline points='2.5,6 5,9 9.5,3' />
              </svg>
            )}
          </button>
        )}
        <ProductThumbnail
          entityType='product'
          entityId={p.product_autoid}
          projectId={projectId}
          className='size-8 shrink-0 rounded-md'
          lazy
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span className='truncate text-[13px] font-medium text-foreground'>
              {p.descr_1 || p.product_id || 'Untitled'}
            </span>
          </div>
          <div className='truncate text-[11px] text-text-tertiary'>
            {p.product_id}
            {p.def_unit && <span className='ml-1.5 text-text-quaternary'>· {p.def_unit}</span>}
          </div>
        </div>

        {isHidden && (
          <span className='shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-text-tertiary'>
            Hidden
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon-xs'
              className='shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-3.5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleActive() }}>
              {isHidden ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
              {isHidden ? 'Show in catalog' : 'Hide from catalog'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateVP() }}>
              <Sparkles className='size-3.5' />
              Create superinventory
            </DropdownMenuItem>
            {onAddToVP && availableVPs && availableVPs.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className='px-2 py-1 text-[11px] font-medium text-text-quaternary'>Add to superinventory</div>
                {availableVPs.map((vp) => (
                  <DropdownMenuItem
                    key={vp.vp_id}
                    onClick={(e) => { e.stopPropagation(); onAddToVP(vp.vp_id) }}
                  >
                    <Layers className='size-3.5 text-purple-500' />
                    <span className='truncate'>{vp.name || vp.vp_id}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              <Trash2 className='size-3.5' />
              Remove from category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-text-quaternary transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </div>

      {isExpanded && (
        <ExpandedProductDetail product={p} projectId={projectId} isMobile={isMobile} />
      )}
    </div>
  )
}


// ── Expanded Product Detail ──────────────────────────────────

function isUsefulText(val?: string | null): val is string {
  if (!val) return false
  const trimmed = val.trim()
  return trimmed.length > 0 && trimmed.toLowerCase() !== 'none'
}

function ExpandedProductDetail({
  product: p,
  projectId,
  isMobile,
}: {
  product: CatalogCategoryProduct
  projectId: number | null
  isMobile?: boolean
}) {
  // Collect non-empty, non-"None" descriptions
  const descriptions = [p.descr_2, p.web_descr1, p.web_descr2, p.web_descr3].filter(isUsefulText)

  return (
    <div className={cn('flex flex-col gap-2 border-t border-border-light bg-bg-secondary/30 py-3', isMobile ? 'px-3.5' : 'px-5')}>
      {/* Metadata pills */}
      <div className='flex flex-wrap gap-1.5'>
        {p.product_id && (
          <span className='inline-flex items-center rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'>
            {p.product_id}
          </span>
        )}
        {p.def_unit && (
          <span className='inline-flex items-center rounded-md bg-bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-text-secondary'>
            {p.def_unit}
          </span>
        )}
      </div>

      {/* Description — only first meaningful one, truncated */}
      {descriptions.length > 0 && (
        <p className='text-[12px] leading-relaxed text-text-tertiary line-clamp-3'>
          {descriptions[0]}
        </p>
      )}

      {/* Product images — compact strip */}
      <ImageStrip
        entityType='product'
        entityId={p.product_autoid}
        projectId={projectId}
        label={`${p.descr_1 || p.product_id} — Images`}
      />
    </div>
  )
}

// ── Superinventory Group ─────────────────────────────────────

function SuperInventoryGroup({
  vp,
  products: groupProducts,
  projectId,
  isMobile,
  expandedProductId,
  onToggleProductExpand,
  onToggleProductActive,
  onCreateVPFromProduct,
  onRemoveProduct,
  onNavigateToVP,
  onRemoveVP,
}: {
  vp: CatalogCategoryVP
  products: CatalogCategoryProduct[]
  projectId: number | null
  isMobile?: boolean
  expandedProductId: string | null
  onToggleProductExpand: (autoid: string) => void
  onToggleProductActive: (p: CatalogCategoryProduct) => void
  onCreateVPFromProduct: (p: CatalogCategoryProduct) => void
  onRemoveProduct: (p: CatalogCategoryProduct) => void
  onNavigateToVP: () => void
  onRemoveVP: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='border-b border-border-light'>
      {/* SI header */}
      <div
        className={cn(
          'group flex cursor-pointer items-center gap-3 py-2 transition-colors hover:bg-purple-500/[0.03]',
          isMobile ? 'px-3.5' : 'px-5',
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <ProductThumbnail
          entityType='vp'
          entityId={vp.vp_id}
          projectId={projectId}
          className='size-8 shrink-0 rounded-md'
          lazy
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <span className='truncate text-[13px] font-medium text-foreground'>
              {vp.name || vp.vp_id}
            </span>
            <span className='shrink-0 rounded bg-purple-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-purple-500'>
              SUPER
            </span>
            {groupProducts.length > 0 && (
              <span className='shrink-0 text-[11px] tabular-nums text-text-quaternary'>
                {groupProducts.length} item{groupProducts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className='truncate text-[11px] text-text-tertiary'>
            {vp.slug || 'Superinventory'}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon-xs'
              className='shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-3.5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigateToVP() }}>
              <ChevronRight className='size-3.5' />
              View details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onClick={(e) => { e.stopPropagation(); onRemoveVP() }}
            >
              <Trash2 className='size-3.5' />
              Remove from category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-text-quaternary transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Child products */}
      {expanded && groupProducts.length > 0 && (
        <div className='border-l-2 border-purple-500/20 ml-5 sm:ml-9'>
          {groupProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              projectId={projectId}
              isMobile={isMobile}
              indent
              isExpanded={expandedProductId === p.product_autoid}
              onToggleExpand={() => onToggleProductExpand(p.product_autoid)}
              onToggleActive={() => onToggleProductActive(p)}
              onCreateVP={() => onCreateVPFromProduct(p)}
              onRemove={() => onRemoveProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Collapsed preview — show count */}
      {!expanded && groupProducts.length > 0 && (
        <button
          type='button'
          className={cn('flex w-full items-center gap-2 py-1 text-[11px] text-purple-500 hover:bg-purple-500/[0.03] transition-colors', isMobile ? 'px-3.5' : 'pl-16 pr-5')}
          onClick={() => setExpanded(true)}
        >
          Show {groupProducts.length} product{groupProducts.length !== 1 ? 's' : ''} in this group
        </button>
      )}
    </div>
  )
}
