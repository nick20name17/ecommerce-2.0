import { useMutation, useQuery } from '@tanstack/react-query'
import { Box, Layers, Package, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { CATALOG_QUERY_KEYS, getCatalogDetailQuery } from '@/api/catalog/query'
import type { CatalogCategory } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { PageEmpty } from '@/components/common/page-empty'
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
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addItemType, setAddItemType] = useState<'product' | 'variable_product'>('product')

  const { data, isLoading } = useQuery(
    getCatalogDetailQuery(category.id, { project_id: projectId ?? undefined })
  )

  const items = data?.items ?? []

  const removeItemMutation = useMutation({
    mutationFn: (itemRecordId: string) =>
      catalogService.removeItem(category.id, itemRecordId, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Item removed',
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
          onClick={() => {
            setAddItemType('product')
            setAddItemOpen(true)
          }}
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

      {/* Items list */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className={cn('flex flex-col gap-1 py-3', isMobile ? 'px-3.5' : 'px-6')}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-md' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <PageEmpty
            icon={Box}
            title='No items'
            description='Add products or variable products to this category.'
            compact
          />
        ) : (
          <div className='flex flex-col'>
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 border-b border-border-light py-2 hover:bg-bg-hover transition-colors',
                  isMobile ? 'px-3.5' : 'px-6'
                )}
              >
                {item.item_type === 'product' ? (
                  <Package className='size-4 text-amber-500 shrink-0' />
                ) : (
                  <Layers className='size-4 text-purple-500 shrink-0' />
                )}
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-medium truncate'>{item.item_id}</div>
                  <div className='text-[11px] text-text-tertiary capitalize'>
                    {item.item_type.replace('_', ' ')}
                  </div>
                </div>
                {!isMobile && (
                  <span className='text-[11px] text-text-tertiary tabular-nums'>
                    #{item.sort_order}
                  </span>
                )}
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className='text-text-tertiary hover:text-destructive'
                  onClick={() => removeItemMutation.mutate(item.id)}
                >
                  <Trash2 className='size-3.5' />
                </Button>
              </div>
            ))}
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
    </div>
  )
}
