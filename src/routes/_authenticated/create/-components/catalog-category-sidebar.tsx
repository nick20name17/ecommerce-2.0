import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Folder, FolderOpen, ImageOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { getCategoriesQuery } from '@/api/category/query'
import type { Category } from '@/api/category/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type Crumb = { tree_id: string; tree_descr: string }

interface CatalogCategorySidebarProps {
  projectId?: number | null
  value: string | null
  onChange: (next: { treeId: string | null; treeDescr: string }) => void
  className?: string
}

function getLabelForTreeId(results: Category[], treeId: string | null) {
  if (treeId == null) return 'All categories'
  const match = results.find((c) => c.tree_id === treeId)
  return match?.tree_descr ?? 'Category'
}

export function CatalogCategorySidebar({
  projectId,
  value,
  onChange,
  className,
}: CatalogCategorySidebarProps) {
  const [path, setPath] = useState<Crumb[]>([])

  useEffect(() => {
    if (value == null) setPath([])
  }, [value])

  const parentId = path.length > 0 ? path[path.length - 1]?.tree_id : undefined

  const { data, isLoading, isFetching } = useQuery({
    ...getCategoriesQuery({
      parent_id: parentId,
      project_id: projectId ?? undefined,
    }),
    placeholderData: keepPreviousData,
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
      <div className='shrink-0 border-b px-4 py-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-xs font-medium text-muted-foreground'>Categories</p>
            <p className='truncate text-sm font-semibold' title={currentLabel}>
              {currentLabel}
            </p>
          </div>

          {path.length > 0 && (
            <Button
              type='button'
              size='icon-sm'
              variant='ghost'
              className='shrink-0'
              onClick={() => handleGoToCrumb(path.length - 2)}
              title='Back'
            >
              <ChevronLeft className='size-4' />
            </Button>
          )}
        </div>

        <div
          className='mt-2 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          role='navigation'
          aria-label='Category path'
        >
          <button
            type='button'
            className={cn(
              'shrink-0 rounded-md px-2 py-0.5 text-xs transition-colors',
              path.length === 0
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            onClick={handleGoRoot}
            title='Root'
          >
            Root
          </button>

          {path.map((crumb, index) => (
            <div key={crumb.tree_id} className='flex shrink-0 items-center gap-1.5'>
              <ChevronRight className='size-3 shrink-0 text-muted-foreground' />
              <button
                type='button'
                className={cn(
                  'max-w-[140px] shrink-0 truncate rounded-md px-2 py-0.5 text-xs transition-colors sm:max-w-[180px]',
                  index === path.length - 1
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => handleGoToCrumb(index)}
                title={crumb.tree_descr}
              >
                {crumb.tree_descr}
              </button>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='p-2'>
          {loading ? (
            <div className='space-y-2 p-2'>
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={`category-skeleton-${i}`} className='h-10 w-full rounded-lg' />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className='flex flex-col items-center gap-2 px-4 py-10 text-center'>
              <FolderOpen className='size-6 text-muted-foreground' />
              <p className='text-sm font-medium'>No categories</p>
              <p className='text-xs text-muted-foreground'>This folder doesn’t have subcategories.</p>
              {path.length > 0 && (
                <Button type='button' variant='outline' size='sm' onClick={() => handleGoToCrumb(path.length - 2)}>
                  Go back
                </Button>
              )}
            </div>
          ) : (
            <div className='space-y-1'>
              {results.map((category) => {
                  const isActive = value === category.tree_id
                  const hasChildren = category.subcategory_count > 0
                  return (
                    <button
                      key={category.tree_id}
                      type='button'
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                        isActive
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-transparent hover:border-border hover:bg-muted/40',
                        !category.show_web && 'opacity-75'
                      )}
                      onClick={() => handleEnterCategory(category)}
                    >
                      <div className='bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
                        {category.photo ? (
                          <img
                            src={category.photo}
                            alt={category.tree_descr}
                            className='size-full object-cover'
                            loading='lazy'
                          />
                        ) : (
                          <ImageOff className='size-4 text-muted-foreground' />
                        )}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='min-w-0'>
                            <p className='truncate text-sm font-medium' title={category.tree_descr}>
                              {category.tree_descr}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              {category.product_count} product{category.product_count === 1 ? '' : 's'}
                              {hasChildren ? ` • ${category.subcategory_count} folder${category.subcategory_count === 1 ? '' : 's'}` : ''}
                            </p>
                          </div>

                          <div className='text-muted-foreground flex shrink-0 items-center gap-2'>
                            {!category.show_web && (
                              <Badge variant='secondary' className='text-[10px]'>
                                Hidden
                              </Badge>
                            )}
                            <Folder className='size-4 opacity-70 group-hover:opacity-100' />
                            <ChevronRight className='size-4 opacity-70 group-hover:opacity-100' />
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

