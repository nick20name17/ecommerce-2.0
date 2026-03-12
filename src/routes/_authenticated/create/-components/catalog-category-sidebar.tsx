import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Folder, FolderOpen, ImageOff } from 'lucide-react'
import { useMemo } from 'react'

import { getCategoriesQuery } from '@/api/category/query'
import type { Category } from '@/api/category/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type Crumb = { tree_id: string; tree_descr: string }

interface CatalogCategorySidebarProps {
  projectId?: number | null
  value: string | null
  onChange: (next: { treeId: string | null; treeDescr: string }) => void
  path: Crumb[]
  onPathChange: (path: Crumb[]) => void
  className?: string
}

const getLabelForTreeId = (results: Category[], treeId: string | null) => {
  if (treeId == null) return 'All categories'
  const match = results.find((c) => c.tree_id === treeId)
  return match?.tree_descr ?? 'Category'
}

export const CatalogCategorySidebar = ({
  projectId,
  value,
  onChange,
  path,
  onPathChange,
  className
}: CatalogCategorySidebarProps) => {
  const parentId = path.length > 0 ? path[path.length - 1]?.tree_id : undefined

  const { data, isLoading, isFetching } = useQuery({
    ...getCategoriesQuery({
      parent_id: parentId,
      project_id: projectId ?? undefined
    }),
    placeholderData: keepPreviousData
  })

  const results = data?.results ?? []
  const currentLabel = useMemo(() => {
    const fromPath = path.length > 0 ? path[path.length - 1]?.tree_descr : null
    if (fromPath) return fromPath
    return getLabelForTreeId(results, value)
  }, [path, results, value])

  const setTreeId = (treeId: string | null, treeDescr: string) => {
    onChange({ treeId, treeDescr })
  }

  const handleGoBack = () => {
    if (path.length <= 1) {
      onPathChange([])
      setTreeId(null, 'All categories')
    } else {
      const nextPath = path.slice(0, -1)
      onPathChange(nextPath)
      const last = nextPath[nextPath.length - 1]!
      setTreeId(last.tree_id, last.tree_descr)
    }
  }

  const handleEnterCategory = (category: Category) => {
    const nextPath = [...path, { tree_id: category.tree_id, tree_descr: category.tree_descr }]
    onPathChange(nextPath)
    setTreeId(category.tree_id, category.tree_descr)
  }

  const loading = isLoading || isFetching

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* Header */}
      <div className='flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2'>
        <div className='min-w-0'>
          <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
            Categories
          </span>
          <p className='truncate text-[13px] font-semibold' title={currentLabel}>
            {currentLabel}
          </p>
        </div>
        {path.length > 0 && (
          <button
            type='button'
            className='inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
            onClick={handleGoBack}
            title='Back'
          >
            <ChevronLeft className='size-4' />
          </button>
        )}
      </div>

      {/* Category list */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {loading ? (
          <div className='space-y-0'>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`category-skeleton-${i}`}
                className='flex items-center gap-3 border-b border-border-light px-4 py-2'
              >
                <Skeleton className='size-8 rounded-[5px]' />
                <div className='min-w-0 flex-1 space-y-1'>
                  <Skeleton className='h-3.5 w-24' />
                  <Skeleton className='h-3 w-16' />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className='flex flex-col items-center gap-1.5 px-4 py-14 text-center'>
            <FolderOpen className='size-6 text-text-tertiary opacity-40' />
            <p className='text-[13px] font-medium'>No categories</p>
            <p className='text-[12px] text-text-quaternary'>
              This folder doesn't have subcategories.
            </p>
            {path.length > 0 && (
              <button
                type='button'
                className='mt-1 inline-flex h-7 items-center gap-1 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
                onClick={handleGoBack}
              >
                <ChevronLeft className='size-3' />
                Go back
              </button>
            )}
          </div>
        ) : (
          results.map((category) => {
            const isActive = value === category.tree_id
            const hasChildren = category.subcategory_count > 0
            return (
              <button
                key={category.tree_id}
                type='button'
                className={cn(
                  'group/cat flex w-full items-center gap-3 border-b border-border-light px-4 py-2 text-left transition-colors duration-75',
                  isActive ? 'bg-primary/5' : 'hover:bg-bg-hover/50',
                  !category.show_web && 'opacity-60'
                )}
                onClick={() => handleEnterCategory(category)}
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border',
                    isActive ? 'border-primary/30' : 'border-border'
                  )}
                >
                  {category.photo ? (
                    <img
                      src={category.photo}
                      alt={category.tree_descr}
                      className='size-full object-cover'
                      loading='lazy'
                    />
                  ) : (
                    <ImageOff className='size-3 text-text-quaternary' />
                  )}
                </div>

                {/* Info */}
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] font-medium' title={category.tree_descr}>
                    {category.tree_descr}
                  </p>
                  <p className='text-[12px] text-text-tertiary'>
                    {category.product_count} product{category.product_count === 1 ? '' : 's'}
                    {hasChildren
                      ? ` · ${category.subcategory_count} folder${category.subcategory_count === 1 ? '' : 's'}`
                      : ''}
                  </p>
                </div>

                {/* Right side */}
                <div className='flex shrink-0 items-center gap-1.5 text-text-quaternary'>
                  {!category.show_web && (
                    <span className='rounded-[4px] border border-border px-1.5 py-px text-[10px] font-medium text-text-tertiary'>
                      Hidden
                    </span>
                  )}
                  {hasChildren && (
                    <Folder className='size-3.5 opacity-60 group-hover/cat:opacity-100' />
                  )}
                  <ChevronRight className='size-3.5 opacity-60 group-hover/cat:opacity-100' />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
