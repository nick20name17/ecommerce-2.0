import { useNavigate } from '@tanstack/react-router'
import { Bell, Check, CheckCircle, ClipboardList, Package, FileText, Trash2, Truck, Users } from 'lucide-react'
import { useState } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  type AppNotification,
  clearNotifications,
  markAllRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const ENTITY_ICONS: Record<string, typeof Package> = {
  order: Package,
  proposal: FileText,
  customer: Users,
  task: CheckCircle,
  pick_list: ClipboardList,
  shipment: Truck,
}

const EVENT_COLORS: Record<string, string> = {
  created: 'text-emerald-500',
  deleted: 'text-red-500',
  accepted: 'text-blue-500',
  updated: 'text-amber-500',
}

const getNotificationLink = (notification: AppNotification): string | null => {
  if (notification.entity === 'task' && notification.autoid) {
    return `/tasks/${notification.autoid}`
  }
  return null
}

function NotificationItem({ notification, onNavigate }: { notification: AppNotification; onNavigate?: () => void }) {
  const navigate = useNavigate()
  const Icon = ENTITY_ICONS[notification.entity] ?? Package
  const eventColor = EVENT_COLORS[notification.eventType] ?? 'text-text-tertiary'
  const link = getNotificationLink(notification)

  const handleClick = () => {
    if (link) {
      navigate({ to: link })
      onNavigate?.()
    }
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3 py-2 transition-colors duration-[80ms]',
        !notification.read && 'bg-primary/[0.03]',
        link && 'cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
      )}
      onClick={handleClick}
      role={link ? 'button' : undefined}
    >
      <div className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[5px]', eventColor)}>
        <Icon className='size-3.5' />
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-[13px] leading-tight'>
          <span className='font-semibold'>{notification.entityLabel}</span>
          {' '}
          <span className='text-text-secondary'>{notification.eventType}</span>
        </p>
        <p className='mt-0.5 truncate font-mono text-[11px] text-text-tertiary'>
          {notification.autoid}
        </p>
      </div>
      <div className='flex shrink-0 items-center gap-1.5'>
        {!notification.read && (
          <div className='size-1.5 rounded-full bg-primary' />
        )}
        <span className='text-[11px] tabular-nums text-text-quaternary'>
          {formatTimeAgo(notification.timestamp)}
        </span>
      </div>
    </div>
  )
}

export const NotificationBell = () => {
  const notifications = useNotifications()
  const unreadCount = useUnreadCount()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='relative flex size-[30px] shrink-0 items-center justify-center rounded-md text-text-tertiary transition-[background-color,color,transform] duration-100 hover:bg-black/[0.04] hover:text-text-secondary active:scale-[0.92] dark:hover:bg-white/[0.04]'
          onClick={() => markAllRead()}
        >
          <Bell className='size-[14px]' />
          {unreadCount > 0 && (
            <span className='absolute -top-0.5 -right-0.5 flex size-[14px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[340px] overflow-hidden rounded-[10px] border-border p-0'
        side='right'
        align='end'
        sideOffset={6}
        style={{ boxShadow: 'var(--dropdown-shadow)' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border px-3 py-2'>
          <span className='text-[13px] font-semibold'>Notifications</span>
          <div className='flex items-center gap-1'>
            {unreadCount > 0 && (
              <button
                type='button'
                className='inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary transition-colors hover:bg-bg-hover hover:text-foreground'
                onClick={markAllRead}
              >
                <Check className='size-3' />
                Mark read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type='button'
                className='inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary transition-colors hover:bg-bg-hover hover:text-foreground'
                onClick={clearNotifications}
              >
                <Trash2 className='size-3' />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className='max-h-[360px] overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <Bell className='mb-2 size-5 text-text-quaternary' />
              <p className='text-[13px] text-text-tertiary'>No notifications yet</p>
            </div>
          ) : (
            <div className='divide-y divide-border-light'>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
