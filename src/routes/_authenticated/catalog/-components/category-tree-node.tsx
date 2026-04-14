import { ChevronRight, FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { CatalogCategory } from '@/api/catalog/schema'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface CategoryTreeNodeProps {
  category: CatalogCategory
  depth: number
  projectId: number | null
  selectedId: string | null
  onSelect: (category: CatalogCategory) => void
  onEdit: (category: CatalogCategory) => void
  onDelete: (category: CatalogCategory) => void
  onAddChild: (parentId: string) => void
}

export const CategoryTreeNode = ({
  category,
  depth,
  projectId,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryTreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedId === category.id

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-1.5 text-[13px] transition-colors duration-75 cursor-pointer',
          'h-9 sm:h-8',
          isSelected
            ? 'bg-primary/10 text-foreground font-medium'
            : 'hover:bg-bg-hover text-text-secondary'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={() => onSelect(category)}
      >
        <button
          type='button'
          className={cn(
            'flex size-6 sm:size-5 shrink-0 items-center justify-center rounded transition-colors',
            hasChildren ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'invisible'
          )}
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
        >
          <ChevronRight
            className={cn(
              'size-3.5 transition-transform duration-150',
              expanded && 'rotate-90'
            )}
          />
        </button>

        <FolderOpen className='size-4 shrink-0 text-amber-500' />
        <span className='flex-1 truncate'>{category.name}</span>

        {((category.product_count ?? 0) > 0 || (category.vp_count ?? 0) > 0) && (
          <span className='text-[10px] text-text-quaternary tabular-nums shrink-0'>
            {(category.product_count ?? 0) + (category.vp_count ?? 0)}
          </span>
        )}

        {!category.active && (
          <>
            <span className='hidden sm:inline rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-text-tertiary'>
              Inactive
            </span>
            <span className='sm:hidden size-2 shrink-0 rounded-full bg-muted' title='Inactive' />
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon-xs'
              className='sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-3.5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-40'>
            <DropdownMenuItem onClick={() => onAddChild(category.id)}>
              <Plus className='size-3.5' />
              Add subcategory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Pencil className='size-3.5' />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={() => onDelete(category)}
            >
              <Trash2 className='size-3.5' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && hasChildren && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              depth={depth + 1}
              projectId={projectId}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}
