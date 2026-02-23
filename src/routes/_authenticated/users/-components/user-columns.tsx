'use no memo'

import { useMutation } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { USERS_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { RoleBadge } from '@/components/common/role-badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate } from '@/helpers/formatters'

interface UserColumnsOptions {
  currentUserId: number | undefined
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const StatusToggle = ({ user, currentUserId }: { user: User; currentUserId: number | undefined }) => {
  const isSelf = user.id === currentUserId

  const toggleMutation = useMutation({
    mutationFn: () =>
      userService.update({ id: user.id, payload: { is_active: !user.is_active } }),
    meta: {
      successMessage: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
      invalidatesQuery: USERS_QUERY_KEYS.lists()
    }
  })

  const toggle = (
    <Switch
      checked={user.is_active}
      disabled={isSelf || toggleMutation.isPending}
      onCheckedChange={() => toggleMutation.mutate()}
      aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
    />
  )

  if (!isSelf) return toggle

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-flex'>{toggle}</span>
      </TooltipTrigger>
      <TooltipContent>You cannot deactivate your own account</TooltipContent>
    </Tooltip>
  )
}

export const getUserColumns = ({
  currentUserId,
  onEdit,
  onDelete
}: UserColumnsOptions): ColumnDef<User>[] => {
  const isSelf = (user: User) => user.id === currentUserId

  return [
    {
      id: 'user',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      header: ({ column }) => <ColumnHeader column={column} title='User' />,
      cell: ({ row }) => {
        const user = row.original
        const fullName = `${user.first_name} ${user.last_name}`

        return (
          <div className='flex min-w-0 items-center gap-3'>
            <Avatar className='size-8 shrink-0'>
              <AvatarFallback className='bg-primary/10 text-xs font-medium text-primary'>
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className='truncate font-medium'>{fullName}</p>
                </TooltipTrigger>
                <TooltipContent>{fullName}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
                </TooltipTrigger>
                <TooltipContent>{user.email}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )
      },
      size: 280
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <ColumnHeader column={column} title='Role' />,
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
      size: 120
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <StatusToggle user={row.original} currentUserId={currentUserId} />,
      size: 80,
      enableSorting: false
    },
    {
      accessorKey: 'date_joined',
      header: ({ column }) => <ColumnHeader column={column} title='Joined' />,
      cell: ({ row }) => (
        <span className='text-muted-foreground'>{formatDate(row.original.date_joined)}</span>
      ),
      size: 130
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon-sm'>
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Pencil className='size-4' />
                Edit
              </DropdownMenuItem>
              {!isSelf(user) && (
                <DropdownMenuItem variant='destructive' onClick={() => onDelete(user)}>
                  <Trash2 className='size-4' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 50,
      enableSorting: false
    }
  ]
}
