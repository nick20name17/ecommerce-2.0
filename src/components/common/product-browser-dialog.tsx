import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Folder, FolderOpen, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { categoryService } from '@/api/category/service'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const DEPTH_COLORS = [
  'text-blue-500 fill-blue-500/20',
  'text-violet-500 fill-violet-500/20',
  'text-amber-500 fill-amber-500/20',
  'text-emerald-500 fill-emerald-500/20',
  'text-rose-500 fill-rose-500/20',
  'text-cyan-500 fill-cyan-500/20'
]

interface ProductRow {
  autoid: string
  id: string
  descr_1: string
}

interface ProductBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
  onSelect: (products: { autoid: string; id: string; descr_1: string }[]) => void
  title?: string
  /** Pre-select this EBMS category when dialog opens */
  defaultCategoryId?: string | null
}

export const ProductBrowserDialog = ({
  open,
  onOpenChange,
  projectId,
  onSelect,
  title = 'Browse Products',
  defaultCategoryId
}: ProductBrowserDialogProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<Map<string, ProductRow>>(new Map())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const debouncedSetSearch = useDebouncedCallback((val: string) => setDebouncedSearch(val), 300)

  useEffect(() => {
    if (open) {
      if (defaultCategoryId) {
        setSelectedCategoryId(defaultCategoryId)
        setExpandedCategories(new Set([defaultCategoryId]))
      }
    } else {
      setSelected(new Map())
      setSearch('')
      setDebouncedSearch('')
      setSelectedCategoryId(null)
      setExpandedCategories(new Set())
    }
  }, [open, defaultCategoryId])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    debouncedSetSearch(val)
  }

  const toggleProduct = (product: ProductRow) => {
    setSelected(prev => {
      const next = new Map(prev)
      if (next.has(product.autoid)) {
        next.delete(product.autoid)
      } else {
        next.set(product.autoid, product)
      }
      return next
    })
  }

  const handleAdd = () => {
    onSelect(Array.from(selected.values()))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex h-[80vh] flex-col gap-0 p-0 sm:max-w-4xl'>
        {/* Header with search */}
        <div className='flex shrink-0 flex-col gap-3 border-b border-border px-5 pt-5 pb-3'>
          <div className='flex items-center gap-2'>
            <DialogTitle className='flex-1 text-[15px]'>{title}</DialogTitle>
            {selected.size > 0 && (
              <span className='rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground'>
                {selected.size} selected
              </span>
            )}
          </div>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-tertiary' />
            <Input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder='Search by ID or description...'
              className='h-9 pl-9 text-[13px]'
            />
          </div>
        </div>

        {/* Body: categories + products */}
        <div className='flex min-h-0 flex-1 overflow-hidden'>
          {/* Left: EBMS categories */}
          <div className='w-[240px] shrink-0 overflow-y-auto border-r border-border bg-bg-secondary/30'>
            <div className='p-1.5'>
              <button
                type='button'
                className={cn(
                  'w-full rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors',
                  selectedCategoryId === null && !debouncedSearch
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-bg-hover'
                )}
                onClick={() => {
                  setSelectedCategoryId(null)
                  setSearch('')
                  setDebouncedSearch('')
                }}
              >
                All Products
              </button>
              <CategoryTreeBrowser
                projectId={projectId}
                selectedId={selectedCategoryId}
                onSelect={setSelectedCategoryId}
                expanded={expandedCategories}
                onToggleExpand={id =>
                  setExpandedCategories(prev => {
                    const next = new Set(prev)
                    if (next.has(id)) next.delete(id)
                    else next.add(id)
                    return next
                  })
                }
              />
            </div>
          </div>

          {/* Right: products list */}
          <div className='flex-1 overflow-y-auto'>
            <ProductList
              projectId={projectId}
              categoryId={selectedCategoryId}
              search={debouncedSearch}
              selected={selected}
              onToggle={toggleProduct}
            />
          </div>
        </div>

        {/* Footer */}
        <div className='flex shrink-0 items-center gap-2 border-t border-border px-5 py-3'>
          <div className='flex-1' />
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            Add {selected.size > 0 ? `${selected.size} products` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Category tree browser ──────────────────────────────────

function CategoryTreeBrowser({
  projectId,
  selectedId,
  onSelect,
  expanded,
  onToggleExpand,
  parentId,
  depth = 0
}: {
  projectId: number | null
  selectedId: string | null
  onSelect: (id: string) => void
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  parentId?: string
  depth?: number
}) {
  const { data } = useQuery({
    queryKey: ['ebms-categories', projectId, parentId ?? 'root'],
    queryFn: () =>
      categoryService.get({
        parent_id: parentId,
        project_id: projectId ?? undefined
      }),
    enabled: parentId !== undefined || depth === 0,
    staleTime: 5 * 60 * 1000
  })

  const categories = data?.results ?? []
  if (categories.length === 0) return null

  return (
    <>
      {categories.map(cat => {
        const isExpanded = expanded.has(cat.tree_id)
        const hasChildren = cat.subcategory_count > 0
        return (
          <div key={cat.tree_id}>
            <div
              className={cn(
                'flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[12px] transition-colors',
                selectedId === cat.tree_id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-text-secondary hover:bg-bg-hover'
              )}
              style={{ paddingLeft: `${depth * 14 + 6}px` }}
              onClick={() => onSelect(cat.tree_id)}
            >
              {hasChildren ? (
                <button
                  type='button'
                  className='shrink-0 p-0.5'
                  onClick={e => {
                    e.stopPropagation()
                    onToggleExpand(cat.tree_id)
                  }}
                >
                  <ChevronRight
                    className={cn('size-3 transition-transform', isExpanded && 'rotate-90')}
                  />
                </button>
              ) : (
                <span className='w-4 shrink-0' />
              )}
              {cat.photo ? (
                <div className='size-4 shrink-0 overflow-hidden rounded-[3px] border border-border/50 bg-bg-secondary'>
                  <img src={cat.photo} alt='' className='size-full object-cover' loading='lazy' />
                </div>
              ) : isExpanded && hasChildren ? (
                <FolderOpen
                  className={cn(
                    'size-3.5 shrink-0',
                    DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)]
                  )}
                />
              ) : (
                <Folder
                  className={cn(
                    'size-3.5 shrink-0',
                    DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)]
                  )}
                />
              )}
              <span className='flex-1 truncate'>{cat.tree_descr}</span>
              {cat.product_count > 0 && (
                <span className='text-text-quaternary text-[10px] tabular-nums'>
                  {cat.product_count}
                </span>
              )}
            </div>
            {isExpanded && hasChildren && (
              <CategoryTreeBrowser
                projectId={projectId}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                parentId={cat.tree_id}
                depth={depth + 1}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

// ── Product list ───────────────────────────────────────────

function ProductList({
  projectId,
  categoryId,
  search,
  selected,
  onToggle
}: {
  projectId: number | null
  categoryId: string | null
  search: string
  selected: Map<string, ProductRow>
  onToggle: (product: ProductRow) => void
}) {
  const [offset, setOffset] = useState(0)
  const limit = 50

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0)
  }, [categoryId, search])

  const { data, isLoading } = useQuery({
    queryKey: ['product-browse', projectId, categoryId, search, offset],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        limit,
        offset,
        fields: 'id,autoid,descr_1'
      }
      if (projectId) params.project_id = projectId
      if (search) params.search = search
      if (categoryId) params.category = categoryId
      const { data } = await api.get<{
        count: number
        results: ProductRow[]
      }>('/data/products/', { params })
      return data
    },
    staleTime: 30_000
  })

  const products = data?.results ?? []
  const count = data?.count ?? 0
  const hasMore = offset + limit < count

  if (isLoading) {
    return (
      <div className='flex flex-col gap-1 p-3'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className='h-8 w-full rounded' />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className='flex h-full items-center justify-center p-6 text-[13px] text-text-tertiary'>
        {search || categoryId ? 'No products found' : 'Select a category or search'}
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 flex items-center gap-3 border-b border-border bg-bg-secondary px-3 py-1.5 text-[11px] font-medium text-text-tertiary'>
        <div className='w-5 shrink-0' />
        <div className='w-[120px] shrink-0'>Product ID</div>
        <div className='flex-1'>Description</div>
      </div>

      {products.map(product => {
        const isSelected = selected.has(product.autoid)
        return (
          <div
            key={product.autoid}
            className={cn(
              'flex cursor-pointer items-center gap-3 border-b border-border-light px-3 py-1.5 transition-colors',
              isSelected ? 'bg-primary/5' : 'hover:bg-bg-hover'
            )}
            onClick={() => onToggle(product)}
          >
            <Checkbox checked={isSelected} className='shrink-0' />
            <div className='w-[120px] shrink-0 truncate font-mono text-[12px] text-text-secondary'>
              {product.id}
            </div>
            <div className='min-w-0 flex-1 truncate text-[13px]'>{product.descr_1}</div>
          </div>
        )
      })}

      {/* Pagination */}
      {(hasMore || offset > 0) && (
        <div className='flex items-center justify-between border-t border-border bg-bg-secondary px-3 py-2'>
          <span className='text-[11px] text-text-tertiary'>
            {offset + 1}–{Math.min(offset + limit, count)} of {count}
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
              onClick={() => setOffset(prev => prev + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
