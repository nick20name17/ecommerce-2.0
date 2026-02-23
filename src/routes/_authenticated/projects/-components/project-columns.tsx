import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Project } from '@/api/project/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { HealthCell } from '@/components/common/project-health-cell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/helpers/formatters'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'

interface ProjectColumnsOptions {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function renderServiceHealthCell(project: Project, service: ProjectHealthService) {
  const { status, responseMs, lastChecked } = getServiceHealthDetails(project, service)
  return (
    <HealthCell
      status={status}
      responseMs={responseMs}
      lastChecked={lastChecked}
    />
  )
}

function renderStatusOnlyCell(status: 'healthy' | 'unhealthy' | null) {
  return <HealthCell status={status} />
}

export const getProjectColumns = ({
  onEdit,
  onDelete
}: ProjectColumnsOptions): ColumnDef<Project>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Project Name'
      />
    ),
    cell: ({ row }) => {
      const name = row.original.name
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='block max-w-full truncate font-medium'>{name}</span>
          </TooltipTrigger>
          <TooltipContent>{name}</TooltipContent>
        </Tooltip>
      )
    },
    size: 200
  },
  {
    accessorKey: 'db_type',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='DB Type'
      />
    ),
    cell: ({ row }) => (
      <Badge
        className='whitespace-nowrap'
        variant='secondary'
      >
        {row.original.db_type}
      </Badge>
    ),
    size: 120
  },
  {
    accessorKey: 'db_host',
    header: 'Host',
    cell: ({ row }) => {
      const host = row.original.db_host
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='text-muted-foreground block max-w-full truncate'>{host}</span>
          </TooltipTrigger>
          <TooltipContent>{host}</TooltipContent>
        </Tooltip>
      )
    },
    size: 160,
    enableSorting: false
  },
  {
    accessorKey: 'website_status',
    header: 'Frontend',
    cell: ({ row }) => renderServiceHealthCell(row.original, 'website'),
    size: 100,
    enableSorting: false
  },
  {
    accessorKey: 'backend_status',
    header: 'Backend',
    cell: ({ row }) => renderServiceHealthCell(row.original, 'backend'),
    size: 100,
    enableSorting: false
  },
  {
    accessorKey: 'ebms_status',
    header: 'EBMS',
    cell: ({ row }) => renderServiceHealthCell(row.original, 'ebms'),
    size: 90,
    enableSorting: false
  },
  {
    accessorKey: 'db_status',
    header: 'Database',
    cell: ({ row }) => renderServiceHealthCell(row.original, 'sync'),
    size: 100,
    enableSorting: false
  },
  {
    accessorKey: 'overall_status',
    header: 'Status',
    cell: ({ row }) => renderStatusOnlyCell(row.original.overall_status ?? null),
    size: 100,
    enableSorting: false
  },
  {
    accessorKey: 'user_count',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Users'
      />
    ),
    cell: ({ row }) => <span className='whitespace-nowrap'>{row.original.user_count}</span>,
    size: 80
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <ColumnHeader
        column={column}
        title='Created'
      />
    ),
    cell: ({ row }) => formatDate(row.original.created_at),
    size: 130
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const project = row.original

      return (
        <div className='flex justify-center'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm'>
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className='size-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => onDelete(project)}
              >
                <Trash2 className='size-4' />
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
