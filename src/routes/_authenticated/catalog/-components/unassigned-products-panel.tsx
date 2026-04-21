import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, FolderPlus, Package, Search, Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDebouncedCallback } from 'use-debounce'

import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import { catalogService } from '@/api/catalog/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { CategoryPickerDialog } from './category-picker-dialog'

interface UnassignedProductsPanelProps {
  projectId: number | null
  isMobile?: boolean
}

export const UnassignedProductsPanel = ({
  projectId,
  isMobile,
}: UnassignedProductsPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Category picker state
  const [pickerProduct, setPickerProduct] = useState<{ autoid: string; id: string; descr_1: string } | null>(null)

  const debouncedSetSearch = useDebouncedCallback((val: string) => {
    setDebouncedSearch(val)
    setOffset(0)
  }, 300)

  const handleSearch = (val: string) => {
    setSearch(val)
    debouncedSetSearch(val)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['unassigned-products', projectId, debouncedSearch, offset],
    queryFn: () =>
      catalogService.getUnassignedProducts({
        project_id: projectId ?? undefined,
        search: debouncedSearch || undefined,
        limit,
        offset,
      }),
    staleTime: 60_000,
  })

  const products = data?.results ?? []
  const total = data?.count ?? 0
  const hasMore = offset + limit < total

  const addToCategoryMutation = useMutation({
    mutationFn: ({ categoryId, autoid }: { categoryId: string; autoid: string }) =>
      catalogService.addProduct(categoryId, { product_autoid: autoid }, { project_id: projectId ?? undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unassigned-products'] })
      queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.all() })
    },
  })

  const createVPMutation = useMutation({
    mutationFn: async (product: { autoid: string; descr_1: string }) => {
      const params = { project_id: projectId ?? undefined }
      const vp = await variableProductService.create({ name: product.descr_1 }, params)
      await variableProductService.addItem(vp.id, { product_autoid: product.autoid, is_default: true }, params)
      return vp
    },
    onSuccess: (vp) => {
      queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
      navigate({ to: `/catalog/vp/${vp.id}` })
    },
  })

  const handleDragStart = (e: React.DragEvent, product: typeof products[0]) => {
    e.dataTransfer.setData('application/product-autoid', product.autoid)
    e.dataTransfer.setData('text/plain', product.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border py-3',
          isMobile ? 'flex-wrap px-3.5' : 'px-6'
        )}
      >
        <AlertCircle className='size-4 text-amber-500 shrink-0' />
        <h2 className='text-[14px] font-semibold flex-1'>
          Unassigned Products
          {total > 0 && (
            <span className='ml-1.5 text-[12px] font-normal text-text-tertiary'>
              ({total})
            </span>
          )}
        </h2>
      </div>

      {/* Search */}
      <div className={cn('border-b border-border py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary' />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder='Search by ID or description...'
            className='pl-8 h-8 text-[13px]'
          />
        </div>
        <p className='mt-1.5 text-[11px] text-text-quaternary'>
          Drag products onto categories in the tree, or use the menu.
        </p>
      </div>

      {/* List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className={cn('flex flex-col gap-1 py-3', isMobile ? 'px-3.5' : 'px-6')}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-md' />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-text-tertiary py-12'>
            <Package className='size-8 mb-2 text-text-quaternary' />
            <p className='text-[13px]'>
              {debouncedSearch ? 'No matching products' : 'All products are assigned to categories'}
            </p>
          </div>
        ) : (
          <>
            <div className='flex flex-col'>
              {products.map((product) => (
                <div
                  key={product.autoid}
                  draggable
                  onDragStart={(e) => handleDragStart(e, product)}
                  className={cn(
                    'group flex items-center gap-3 border-b border-border-light py-2 cursor-grab active:cursor-grabbing hover:bg-bg-hover transition-colors',
                    isMobile ? 'px-3.5' : 'px-6'
                  )}
                >
                  <Package className='size-4 text-amber-500 shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <div className='text-[13px] font-medium truncate font-mono'>
                      {product.id}
                    </div>
                    {product.descr_1 && (
                      <div className='text-[11px] text-text-tertiary truncate'>
                        {product.descr_1}
                      </div>
                    )}
                  </div>
                  {product.wtree_id && (
                    <span className='text-[10px] text-text-quaternary tabular-nums shrink-0'>
                      cat:{product.wtree_id}
                    </span>
                  )}

                  {/* Context menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon-xs'
                        className='opacity-0 group-hover:opacity-100 shrink-0'
                      >
                        <span className='text-[16px] leading-none'>···</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      <DropdownMenuItem onClick={() => setPickerProduct(product)}>
                        <FolderPlus className='size-3.5' />
                        Add to category
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => createVPMutation.mutate(product)}>
                        <Sparkles className='size-3.5' />
                        Create VP from product
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {(hasMore || offset > 0) && (
              <div className={cn(
                'flex items-center justify-between border-t border-border py-2',
                isMobile ? 'px-3.5' : 'px-6'
              )}>
                <span className='text-[11px] text-text-tertiary'>
                  {offset + 1}–{Math.min(offset + limit, total)} of {total}
                </span>
                <div className='flex gap-1'>
                  <Button
                    variant='outline'
                    size='xs'
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='xs'
                    disabled={!hasMore}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Category picker dialog */}
      <CategoryPickerDialog
        open={!!pickerProduct}
        onOpenChange={(v) => !v && setPickerProduct(null)}
        projectId={projectId}
        onSelect={(categoryId) => {
          if (pickerProduct) {
            addToCategoryMutation.mutate({ categoryId, autoid: pickerProduct.autoid })
            setPickerProduct(null)
          }
        }}
      />
    </div>
  )
}
