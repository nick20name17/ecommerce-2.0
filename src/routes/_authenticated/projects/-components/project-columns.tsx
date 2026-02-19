import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Project } from '@/api/project/schema'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatResponseTime } from '@/helpers/formatters'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'
import { cn } from '@/lib/utils'

interface ProjectColumnsOptions {
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

function HealthCell({
  status,
  responseMs,
  lastChecked
}: {
  status: 'healthy' | 'unhealthy' | null
  responseMs?: number
  lastChecked?: string
}) {
  const isHealthy = status === 'healthy'
  const isUnhealthy = status === 'unhealthy'
  const isEmpty = status === null

  const tooltipLines: string[] = []
  if (responseMs !== undefined) tooltipLines.push(`Response: ${formatResponseTime(responseMs)}`)
  if (lastChecked) tooltipLines.push(`Last checked: ${formatDate(lastChecked, 'dateTime')}`)

  const trigger = (
    <span
      className={cn(
        'flex size-6 items-center justify-center rounded-full p-1 transition-all hover:scale-120',
        isHealthy && 'bg-green-500/15',
        isUnhealthy && 'bg-destructive/15',
        isEmpty && 'bg-muted'
      )}
    >
      <span
        className={cn(
          'size-full rounded-full',
          isHealthy && 'bg-green-500',
          isUnhealthy && 'bg-destructive',
          isEmpty && 'bg-muted-foreground/50'
        )}
      />
    </span>
  )

  if (tooltipLines.length === 0) {
    return <span className='inline-flex'>{trigger}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{trigger}</span>
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex flex-col gap-0.5'>
          {tooltipLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
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
    header: 'Actions',
    cell: ({ row }) => {
      const project = row.original

      return (
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
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant='destructive'
              onClick={() => onDelete(project)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    size: 50,
    enableSorting: false
  }
]
