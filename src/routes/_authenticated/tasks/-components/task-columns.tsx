'use no memo'

import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { TaskListItem } from '@/api/task/schema'
import type { TaskStatus } from '@/api/task/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getTaskPriorityColor, getTaskPriorityLabel } from '@/constants/task'
import { formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'

interface TaskColumnsOptions {
  onEdit: (task: TaskListItem) => void
  onDelete: (task: TaskListItem) => void
  statuses: TaskStatus[]
  onStatusChange: (task: TaskListItem, statusId: number) => void
}

export const getTaskColumns = ({
  onEdit,
  onDelete,
  statuses,
  onStatusChange
}: TaskColumnsOptions): ColumnDef<TaskListItem>[] => [
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Title'
      />
    ),
    cell: ({ row }) => {
      const title = row.original.title
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate font-medium'>{title}</span>
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
      )
    },
    size: 220
  },
  {
    accessorKey: 'status_name',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Status'
      />
    ),
    cell: ({ row }) => {
      const t = row.original
      return (
        <div
          role='group'
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
        >
          <Select
            value={String(t.status)}
            onValueChange={(v) => onStatusChange(t, Number(v))}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem
                  key={s.id}
                  value={String(s.id)}
                >
                  <span className='flex items-center gap-1.5'>
                    <span
                      className='size-2 shrink-0 rounded-full'
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    size: 140
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Priority'
      />
    ),
    cell: ({ row }) => {
      const priority = row.original.priority
      return (
        <Badge
          variant='secondary'
          className={cn('flex w-fit items-center gap-1.5 font-medium')}
        >
          <span
            className='size-2 shrink-0 rounded-full'
            style={{ backgroundColor: getTaskPriorityColor(priority) }}
          />
          {getTaskPriorityLabel(priority)}
        </Badge>
      )
    },
    size: 100
  },
  {
    accessorKey: 'due_date',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Due date'
      />
    ),
    cell: ({ row }) => formatDate(row.original.due_date),
    size: 120
  },
  {
    accessorKey: 'responsible_user_name',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Assignee'
      />
    ),
    cell: ({ row }) => {
      const name = row.original.responsible_user_name
      if (!name) return <span className='text-muted-foreground'>—</span>
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{name}</span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      )
    },
    size: 140
  },
  {
    accessorKey: 'author_name',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Author'
      />
    ),
    cell: ({ row }) => {
      const name = row.original.author_name
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate'>{name}</span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      )
    },
    size: 140
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const task = row.original
      return (
        <div
          role='group'
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon-sm'
              >
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(task)}
                className='text-destructive focus:text-destructive'
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    size: 50,
    enableSorting: false
  }
]
