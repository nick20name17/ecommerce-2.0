'use no memo'

import { useMutation } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { USERS_QUERY_KEYS } from '@/api/user/query'
import type { User } from '@/api/user/schema'
import { userService } from '@/api/user/service'
import { ColumnHeader } from '@/components/common/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getUserRoleLabel } from '@/constants/user'
import { formatDate } from '@/helpers/formatters'

interface UserColumnsOptions {
  currentUserId: number | undefined
  onEdit: (user: User) => void
  onDelete: (user: User) => void
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
        <span className="inline-flex">{toggle}</span>
      </TooltipTrigger>
      <TooltipContent>You cannot deactivate your own account</TooltipContent>
    </Tooltip>
  )
}

export const getUserColumns = ({
  currentUserId,
  onEdit,
  onDelete
}: UserColumnsOptions): ColumnDef<User>[] => [
  {
    accessorKey: 'first_name',
    header: ({ column }) => <ColumnHeader column={column} title="First Name" />,
    cell: ({ row }) => row.original.first_name,
    size: 150
  },
  {
    accessorKey: 'last_name',
    header: ({ column }) => <ColumnHeader column={column} title="Last Name" />,
    cell: ({ row }) => row.original.last_name,
    size: 150
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <ColumnHeader column={column} title="Email" />,
    cell: ({ row }) => row.original.email,
    size: 250
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <ColumnHeader column={column} title="Role" />,
    cell: ({ row }) => (
      <Badge variant="secondary">{getUserRoleLabel(row.original.role)}</Badge>
    ),
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
    header: ({ column }) => <ColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => formatDate(row.original.date_joined),
    size: 130
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
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
