import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Folder, FolderOpen, ImageOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getCategoriesQuery } from '@/api/category/query'
import type { Category } from '@/api/category/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Crumb = { tree_id: string; tree_descr: string }

interface CatalogCategorySidebarProps {
  projectId?: number | null
  value: string | null
  onChange: (next: { treeId: string | null; treeDescr: string }) => void
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
  className
}: CatalogCategorySidebarProps) => {
  const [path, setPath] = useState<Crumb[]>([])

  useEffect(() => {
    if (value == null) setPath([])
  }, [value])

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

  const handleGoRoot = () => {
    setPath([])
    setTreeId(null, 'All categories')
  }

  const handleGoToCrumb = (index: number) => {
    const nextPath = path.slice(0, index + 1)
    setPath(nextPath)
    const last = nextPath[nextPath.length - 1]
    if (!last) return handleGoRoot()
    setTreeId(last.tree_id, last.tree_descr)
  }

  const handleEnterCategory = (category: Category) => {
    const nextPath = [...path, { tree_id: category.tree_id, tree_descr: category.tree_descr }]
    setPath(nextPath)
    setTreeId(category.tree_id, category.tree_descr)
  }

  const loading = isLoading || isFetching

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* Header */}
      <div className='flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2'>
        <div className='min-w-0'>
          <span className='text-[12px] font-medium uppercase tracking-[0.04em] text-text-tertiary'>
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
            onClick={() => handleGoToCrumb(path.length - 2)}
            title='Back'
          >
            <ChevronLeft className='size-4' />
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div
        className='flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-4 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        role='navigation'
        aria-label='Category path'
      >
        <button
          type='button'
          className={cn(
            'shrink-0 rounded-[5px] px-1.5 py-0.5 text-[12px] font-medium transition-colors duration-[80ms]',
            path.length === 0
              ? 'bg-primary/10 text-primary'
              : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
          )}
          onClick={handleGoRoot}
        >
          Root
        </button>

        {path.map((crumb, index) => (
          <div key={crumb.tree_id} className='flex shrink-0 items-center gap-0.5'>
            <ChevronRight className='size-3 shrink-0 text-text-quaternary' />
            <button
              type='button'
              className={cn(
                'max-w-[130px] shrink-0 truncate rounded-[5px] px-1.5 py-0.5 text-[12px] font-medium transition-colors duration-[80ms]',
                index === path.length - 1
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
              )}
              onClick={() => handleGoToCrumb(index)}
              title={crumb.tree_descr}
            >
              {crumb.tree_descr}
            </button>
          </div>
        ))}
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
                onClick={() => handleGoToCrumb(path.length - 2)}
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
