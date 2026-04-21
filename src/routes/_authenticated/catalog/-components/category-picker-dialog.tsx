import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FolderClosed, FolderOpen } from 'lucide-react'
import { useState } from 'react'

import { getCatalogTreeQuery } from '@/api/catalog/query'
import type { CatalogCategory } from '@/api/catalog/schema'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CategoryPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number | null
  onSelect: (categoryId: string) => void
}

export const CategoryPickerDialog = ({
  open,
  onOpenChange,
  projectId,
  onSelect,
}: CategoryPickerDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data } = useQuery({
    ...getCatalogTreeQuery({ project_id: projectId ?? undefined }),
    enabled: open,
  })
  const tree = data?.results ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm max-h-[70vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Select Category</DialogTitle>
        </DialogHeader>
        <DialogBody className='flex-1 overflow-y-auto min-h-[200px]'>
          {tree.map((cat) => (
            <PickerNode
              key={cat.id}
              category={cat}
              depth={0}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </DialogBody>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!selectedId}
            onClick={() => {
              if (selectedId) {
                onSelect(selectedId)
                onOpenChange(false)
                setSelectedId(null)
              }
            }}
          >
            Add to Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PickerNode({
  category,
  depth,
  selectedId,
  onSelect,
}: {
  category: CatalogCategory
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = category.children?.length > 0
  const isSelected = selectedId === category.id

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] cursor-pointer transition-colors',
          isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-bg-hover text-text-secondary'
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => onSelect(category.id)}
      >
        {hasChildren ? (
          <button
            type='button'
            className='shrink-0 p-0.5'
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          >
            <ChevronRight className={cn('size-3 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className='w-4 shrink-0' />
        )}
        {expanded && hasChildren ? (
          <FolderOpen className='size-3.5 shrink-0 text-amber-500' />
        ) : (
          <FolderClosed className='size-3.5 shrink-0 text-amber-500' />
        )}
        <span className='flex-1 truncate'>{category.name}</span>
      </div>
      {expanded && hasChildren && category.children.map((child) => (
        <PickerNode
          key={child.id}
          category={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
