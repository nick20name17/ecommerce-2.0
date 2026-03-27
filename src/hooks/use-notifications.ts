import { useSyncExternalStore } from 'react'

export interface AppNotification {
  id: number
  entity: string
  entityLabel: string
  eventType: string
  autoid: string
  user?: string
  timestamp: number
  read: boolean
}

let notifications: AppNotification[] = []
let nextId = 0
let unreadCount = 0
const listeners = new Set<() => void>()

const MAX_NOTIFICATIONS = 50

const notify = () => listeners.forEach((l) => l())

const getEntityLabel = (entity: string): string => {
  switch (entity) {
    case 'order': return 'Order'
    case 'proposal': return 'Proposal'
    case 'note': return 'Note'
    case 'customer': return 'Customer'
    case 'task': return 'Task'
    case 'pick_list': return 'Pick List'
    case 'shipment': return 'Shipment'
    default: return entity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

const getEventLabel = (eventType: string): string => {
  switch (eventType) {
    case 'created': return 'created'
    case 'deleted': return 'deleted'
    case 'accepted': return 'accepted'
    case 'updated': return 'updated'
    default: return eventType
  }
}

export const addNotification = (
  entity: string,
  eventType: string,
  autoid: string,
  user?: string,
) => {
  const notification: AppNotification = {
    id: nextId++,
    entity,
    entityLabel: getEntityLabel(entity),
    eventType: getEventLabel(eventType),
    autoid,
    user,
    timestamp: Date.now(),
    read: false,
  }
  notifications = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS)
  unreadCount++
  notify()
}

export const markAllRead = () => {
  if (unreadCount === 0) return
  notifications = notifications.map((n) => (n.read ? n : { ...n, read: true }))
  unreadCount = 0
  notify()
}

export const clearNotifications = () => {
  notifications = []
  unreadCount = 0
  notify()
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const useNotifications = () =>
  useSyncExternalStore(subscribe, () => notifications)

export const useUnreadCount = () =>
  useSyncExternalStore(subscribe, () => unreadCount)
