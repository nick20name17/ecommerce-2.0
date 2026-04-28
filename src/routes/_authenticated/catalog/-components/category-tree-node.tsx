import { ChevronRight, GripVertical, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'

import type { CatalogCategory } from '@/api/catalog/schema'
import { CategoryIcon } from './category-thumbnail'
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
  onMove?: (categoryId: string, newParentId: string | null) => void
  onProductDrop?: (productAutoid: string, categoryId: string) => void
}

// Color pairs: [stroke, fill] per depth
const DEPTH_STYLES = [
  'text-blue-500 fill-blue-500/20',
  'text-violet-500 fill-violet-500/20',
  'text-amber-500 fill-amber-500/20',
  'text-emerald-500 fill-emerald-500/20',
  'text-rose-500 fill-rose-500/20',
  'text-cyan-500 fill-cyan-500/20',
]

function getDepthStyle(depth: number) {
  return DEPTH_STYLES[Math.min(depth, DEPTH_STYLES.length - 1)]
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
  onMove,
  onProductDrop,
}: CategoryTreeNodeProps) => {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedId === category.id
  const [dragOver, setDragOver] = useState(false)
  const dragCountRef = useRef(0) // track nested drag enter/leave
  const itemCount = (category.product_count ?? 0) + (category.vp_count ?? 0)
  const iconStyle = getDepthStyle(depth)

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.setData('text/plain', category.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/product-autoid') ? 'copy' : 'move'
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current++
    if (dragCountRef.current === 1) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current === 0) setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current = 0
    setDragOver(false)

    const productAutoid = e.dataTransfer.getData('application/product-autoid')
    if (productAutoid && onProductDrop) {
      onProductDrop(productAutoid, category.id)
      return
    }

    const draggedId = e.dataTransfer.getData('text/plain')
    if (draggedId && draggedId !== category.id && onMove) {
      onMove(draggedId, category.id)
      setExpanded(true)
    }
  }

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'group flex items-center gap-1 rounded-md px-1.5 text-[13px] transition-colors duration-75 cursor-pointer',
          'h-8',
          isSelected
            ? 'bg-primary/10 text-foreground font-medium'
            : 'hover:bg-bg-hover text-text-secondary',
          dragOver && 'ring-2 ring-primary bg-primary/10'
        )}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
        onClick={() => onSelect(category)}
      >
        <GripVertical className='size-3 shrink-0 text-text-quaternary opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing' />

        <button
          type='button'
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded transition-colors',
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

        <CategoryIcon
          categoryId={category.id}
          projectId={projectId}
          expanded={expanded}
          hasChildren={!!hasChildren}
          depthStyle={iconStyle}
        />
        <span className='flex-1 truncate'>{category.name}</span>

        {itemCount > 0 && (
          <span className='text-[10px] text-text-quaternary tabular-nums shrink-0 mr-0.5'>
            {itemCount}
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
              onMove={onMove}
              onProductDrop={onProductDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}
