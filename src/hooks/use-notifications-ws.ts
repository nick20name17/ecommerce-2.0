import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { toast } from 'sonner'

import { API_ORIGIN } from '@/api/constants'
import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { NOTE_QUERY_KEYS } from '@/api/note/query'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { SHIPMENT_QUERY_KEYS } from '@/api/shipment/query'
import { TASK_QUERY_KEYS } from '@/api/task/query'
import { isSuperAdmin } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { addNotification } from '@/hooks/use-notifications'
import { resolvePendingCreatedAutoid } from '@/helpers/pending-created-autoid'

const RECONNECT_MIN_MS = 1000
const RECONNECT_MAX_MS = 30000
const RECONNECT_GROW_FACTOR = 2
const PING_INTERVAL_MS = 30000

const getWsOrigin = (): string => API_ORIGIN.replace(/^http/, 'ws')

export interface WSNotificationPayload {
  event_type: string
  entity: string
  autoid: string
  user?: string
  data?: Record<string, unknown>
}

interface UseNotificationsWebSocketOptions {
  projectId: number | null
  enabled?: boolean
  showToasts?: boolean
}

const buildNotificationsWsUrl = (projectId: number | null): string | null => {
  const session = getSession()
  if (!session?.access || !session?.user?.role) return null
  const userIsSuperAdmin = isSuperAdmin(session.user.role)
  if (userIsSuperAdmin && projectId == null) return null

  const wsBaseUrl = getWsOrigin()
  const params = new URLSearchParams({ token: session.access })
  if (userIsSuperAdmin && projectId != null) {
    params.set('project_id', String(projectId))
  }
  return `${wsBaseUrl}/ws/notifications/?${params.toString()}`
}

const getInvalidationKeys = (entity: string): readonly (readonly unknown[])[] => {
  switch (entity) {
    case 'note':
      return [NOTE_QUERY_KEYS.all()]
    case 'order':
      return [ORDER_QUERY_KEYS.lists(), PICK_LIST_QUERY_KEYS.all(), SHIPMENT_QUERY_KEYS.all()]
    case 'proposal':
      return [PROPOSAL_QUERY_KEYS.lists()]
    case 'customer':
      return [CUSTOMER_QUERY_KEYS.lists()]
    case 'task':
      return [TASK_QUERY_KEYS.lists()]
    case 'pick_list':
      return [PICK_LIST_QUERY_KEYS.all(), SHIPMENT_QUERY_KEYS.all()]
    case 'shipment':
      return [SHIPMENT_QUERY_KEYS.all(), PICK_LIST_QUERY_KEYS.all()]
    default:
      return [ORDER_QUERY_KEYS.lists(), PROPOSAL_QUERY_KEYS.lists(), PICK_LIST_QUERY_KEYS.all(), SHIPMENT_QUERY_KEYS.all()]
  }
}

const ENTITY_LABELS: Record<string, string> = {
  order: 'Order',
  proposal: 'Proposal',
  customer: 'Customer',
  task: 'Task',
  pick_list: 'Pick List',
  shipment: 'Shipment',
}

const getToastMessage = (payload: WSNotificationPayload): string => {
  const { entity, event_type, autoid } = payload
  const entityLabel = ENTITY_LABELS[entity] ?? entity
  return `${entityLabel} ${autoid} ${event_type}`
}

const isNotificationPayload = (msg: unknown): msg is WSNotificationPayload => {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'entity' in msg &&
    'autoid' in msg &&
    'event_type' in msg &&
    typeof (msg as WSNotificationPayload).entity === 'string' &&
    typeof (msg as WSNotificationPayload).autoid === 'string' &&
    typeof (msg as WSNotificationPayload).event_type === 'string' &&
    (msg as WSNotificationPayload).entity !== ''
  )
}

export const useNotificationsWebSocket = ({
  projectId,
  enabled = true,
  showToasts = true
}: UseNotificationsWebSocketOptions) => {
  const queryClient = useQueryClient()
  const rwsRef = useRef<ReconnectingWebSocket | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const url = buildNotificationsWsUrl(projectId)
    if (!url) return

    const rws = new ReconnectingWebSocket(url, [], {
      minReconnectionDelay: RECONNECT_MIN_MS,
      maxReconnectionDelay: RECONNECT_MAX_MS,
      reconnectionDelayGrowFactor: RECONNECT_GROW_FACTOR
    })
    rwsRef.current = rws

    rws.addEventListener('message', (event: MessageEvent) => {
      let msg: unknown = null
      try {
        msg = JSON.parse(event.data as string) as unknown
      } catch {
        // ignore parse errors
      }
      if (msg === null || !mountedRef.current) return

      if (
        typeof msg === 'object' &&
        msg !== null &&
        'type' in msg &&
        (msg as { type: string }).type === 'pong'
      )
        return

      if (isNotificationPayload(msg)) {
        const { event_type, entity, autoid, user } = msg
        if (event_type === 'created' && (entity === 'order' || entity === 'proposal')) {
          resolvePendingCreatedAutoid(entity, autoid)
        }
        const keys = getInvalidationKeys(entity)
        for (const queryKey of keys) {
          queryClient.invalidateQueries({ queryKey })
        }
        // Store notification
        const isNote = entity === 'note'
        if (!isNote) {
          addNotification(entity, event_type, autoid, user)
        }
        if (showToasts && !isNote) {
          const isCreateOrderProposal =
            (entity === 'order' || entity === 'proposal') && event_type === 'created'
          const isDeleteOrderProposal =
            (entity === 'order' || entity === 'proposal') && event_type === 'deleted'
          if (isCreateOrderProposal) {
            const label = ENTITY_LABELS[entity] ?? entity
            toast.success(`${label} ${autoid} created successfully`)
          } else if (!isDeleteOrderProposal) {
            toast.info(getToastMessage(msg))
          }
        }
      }
    })

    rws.addEventListener('open', () => {
      pingIntervalRef.current = setInterval(() => {
        if (rwsRef.current?.readyState === ReconnectingWebSocket.OPEN) {
          rwsRef.current.send(JSON.stringify({ type: 'ping' }))
        }
      }, PING_INTERVAL_MS)
    })

    rws.addEventListener('close', () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    })

    rws.addEventListener('error', () => {
      rws.close()
    })

    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        rwsRef.current?.readyState !== ReconnectingWebSocket.OPEN
      ) {
        rwsRef.current?.reconnect()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
      rws.close()
      rwsRef.current = null
    }
  }, [projectId, enabled, showToasts, queryClient])

  return {}
}
