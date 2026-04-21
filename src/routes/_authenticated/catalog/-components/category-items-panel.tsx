import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Box, ChevronDown, Eye, EyeOff, Layers, Package, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { CATALOG_QUERY_KEYS, getCatalogDetailQuery } from '@/api/catalog/query'
import type { CatalogCategory, CatalogCategoryProduct, CatalogCategoryVP } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { ImageGallery } from '@/components/common/image-gallery'
import { PageEmpty } from '@/components/common/page-empty'
import { ProductThumbnail } from '@/components/common/product-thumbnail'
import { ProductBrowserDialog } from '@/components/common/product-browser-dialog'
import { VPCreateFromProductDialog } from './vp-create-from-product-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AddItemDialog } from './add-item-dialog'

interface CategoryItemsPanelProps {
  category: CatalogCategory
  projectId: number | null
  isMobile?: boolean
}

export const CategoryItemsPanel = ({
  category,
  projectId,
  isMobile,
}: CategoryItemsPanelProps) => {
  const navigate = useNavigate()
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addItemType, setAddItemType] = useState<'product' | 'variable_product'>('product')
  const [productBrowserOpen, setProductBrowserOpen] = useState(false)
  const [createVPFromProduct, setCreateVPFromProduct] = useState<CatalogCategoryProduct | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  const { data, isLoading } = useQuery(
    getCatalogDetailQuery(category.id, { project_id: projectId ?? undefined })
  )

  const products = data?.products ?? []
  const variableProducts = data?.variable_products ?? []
  const hasItems = products.length > 0 || variableProducts.length > 0

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

  const queryClient = useQueryClient()

  const toggleProductActiveMutation = useMutation({
    mutationFn: ({ recordId, active }: { recordId: string; active: boolean }) =>
      catalogService.updateProduct(category.id, recordId, { active }, {
        project_id: projectId ?? undefined,
      }),
    onMutate: async ({ recordId, active }) => {
      // Optimistic update — patch all matching detail queries in cache
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

  return (
    <div className='flex h-full flex-col'>
      {/* Panel header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border py-3',
          isMobile ? 'flex-wrap px-3.5' : 'px-6'
        )}
      >
        {!isMobile && (
          <h2 className='text-[14px] font-semibold flex-1 truncate'>{category.name}</h2>
        )}
        {isMobile && <div className='flex-1' />}
        <Button
          variant='outline'
          size='sm'
          onClick={() => setProductBrowserOpen(true)}
          isPending={addProductsMutation.isPending}
        >
          <Plus className='size-3.5' />
          Product
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setAddItemType('variable_product')
            setAddItemOpen(true)
          }}
        >
          <Plus className='size-3.5' />
          {isMobile ? 'VP' : 'Variable Product'}
        </Button>
      </div>

      {/* Category images */}
      <div className={cn('border-b border-border', isMobile ? 'px-3.5 py-3' : 'px-6 py-4')}>
        <ImageGallery entityType='category' entityId={category.id} projectId={projectId} />
      </div>

      {/* Items list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className={cn('flex flex-col gap-1 py-3', isMobile ? 'px-3.5' : 'px-6')}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-md' />
            ))}
          </div>
        ) : !hasItems ? (
          <PageEmpty
            icon={Box}
            title='No items'
            description='Add products or variable products to this category.'
            compact
          />
        ) : (
          <div className='flex flex-col'>
            {/* ── Products section ── */}
            {products.length > 0 && (
              <>
                <div className={cn('flex items-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-quaternary border-b border-border', isMobile ? 'px-3.5' : 'px-6')}>
                  <Package className='size-3 text-amber-500' />
                  Products ({products.length})
                </div>
                {products.map((p) => {
                  const isExpanded = expandedProductId === p.product_autoid
                  return (
                    <div key={p.id} className='border-b border-border-light'>
                      <div
                        className={cn(
                          'flex items-center gap-3 py-2 hover:bg-bg-hover transition-colors cursor-pointer',
                          isMobile ? 'px-3.5' : 'px-6',
                          p.active === false && 'opacity-40'
                        )}
                        onClick={() => setExpandedProductId(isExpanded ? null : p.product_autoid)}
                      >
                        <ProductThumbnail entityType='product' entityId={p.product_autoid} projectId={projectId} className='size-8 shrink-0' />
                        <div className='flex-1 min-w-0'>
                          <div className='text-[13px] font-medium truncate font-mono'>{p.product_id || p.product_autoid}</div>
                          <div className='text-[11px] text-text-tertiary truncate'>{p.descr_1 || 'Product'}</div>
                        </div>
                        {!isMobile && <span className='text-[11px] text-text-tertiary tabular-nums'>#{p.sort_order}</span>}
                        <Button variant='ghost' size='icon-xs' className='shrink-0 text-text-tertiary hover:text-purple-500' onClick={(e) => { e.stopPropagation(); setCreateVPFromProduct(p) }} title='Create VP'>
                          <Sparkles className='size-3.5' />
                        </Button>
                        <Button
                          variant='ghost' size='icon-xs'
                          className={cn('shrink-0', p.active !== false ? 'text-text-tertiary hover:text-amber-500' : 'text-text-quaternary hover:text-emerald-500')}
                          onClick={(e) => { e.stopPropagation(); toggleProductActiveMutation.mutate({ recordId: p.id, active: !(p.active !== false) }) }}
                          title={p.active !== false ? 'Hide' : 'Show'}
                        >
                          {p.active !== false ? <Eye className='size-3.5' /> : <EyeOff className='size-3.5' />}
                        </Button>
                        <Button variant='ghost' size='icon-xs' className='text-text-tertiary hover:text-destructive' onClick={(e) => { e.stopPropagation(); removeProductMutation.mutate(p.id) }}>
                          <Trash2 className='size-3.5' />
                        </Button>
                        <ChevronDown className={cn('size-3.5 shrink-0 text-text-quaternary transition-transform', isExpanded && 'rotate-180')} />
                      </div>
                      {isExpanded && (
                        <div className={cn('pb-3 flex flex-col gap-3', isMobile ? 'px-3.5' : 'px-6')}>
                          <div className='flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-tertiary'>
                            {p.product_id && <span><span className='text-text-secondary font-medium'>ID:</span> {p.product_id}</span>}
                            {p.def_unit && <span><span className='text-text-secondary font-medium'>Unit:</span> {p.def_unit}</span>}
                            <span><span className='text-text-secondary font-medium'>Autoid:</span> {p.product_autoid}</span>
                          </div>
                          {(p.descr_2 || p.web_descr1) && (
                            <div className='text-[12px] text-text-tertiary space-y-1'>
                              {p.descr_2 && <p>{p.descr_2}</p>}
                              {p.web_descr1 && <p>{p.web_descr1}</p>}
                              {p.web_descr2 && <p>{p.web_descr2}</p>}
                              {p.web_descr3 && <p>{p.web_descr3}</p>}
                            </div>
                          )}
                          <ImageGallery entityType='product' entityId={p.product_autoid} projectId={projectId} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* ── Variable Products section ── */}
            {variableProducts.length > 0 && (
              <>
                <div className={cn('flex items-center gap-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-quaternary border-b border-border', isMobile ? 'px-3.5' : 'px-6', products.length > 0 && 'mt-1')}>
                  <Layers className='size-3 text-purple-500' />
                  Variable Products ({variableProducts.length})
                </div>
                {variableProducts.map((vp) => (
                  <div
                    key={vp.id}
                    className={cn(
                      'flex items-center gap-3 border-b border-border-light py-2 hover:bg-bg-hover transition-colors cursor-pointer',
                      isMobile ? 'px-3.5' : 'px-6'
                    )}
                    onClick={() => navigate({ to: `/catalog/vp/${vp.vp_id}` })}
                  >
                    <ProductThumbnail entityType='vp' entityId={vp.vp_id} projectId={projectId} className='size-8 shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-1.5'>
                        <span className='text-[13px] font-medium truncate'>{vp.name || vp.vp_id}</span>
                        <span className='shrink-0 rounded bg-purple-500/10 px-1 py-0.5 text-[9px] font-bold uppercase text-purple-500'>VP</span>
                      </div>
                      <div className='text-[11px] text-text-tertiary'>{vp.slug || 'Variable Product'}</div>
                    </div>
                    {!isMobile && <span className='text-[11px] text-text-tertiary tabular-nums'>#{vp.sort_order}</span>}
                    <Button variant='ghost' size='icon-xs' className='text-text-tertiary hover:text-destructive' onClick={(e) => { e.stopPropagation(); removeVPMutation.mutate(vp.id) }}>
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

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
