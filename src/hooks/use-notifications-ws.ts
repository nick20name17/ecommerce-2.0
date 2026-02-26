import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { toast } from 'sonner'

import { API_ORIGIN } from '@/api/constants'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { isSuperAdmin } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { resolvePendingCreatedAutoid } from '@/helpers/pending-created-autoid'

const RECONNECT_MIN_MS = 1000
const RECONNECT_MAX_MS = 30000
const RECONNECT_GROW_FACTOR = 2
const PING_INTERVAL_MS = 30000

function getWsOrigin(): string {
  return API_ORIGIN.replace(/^http/, 'ws')
}

export interface WSNotificationPayload {
  type: string
  entity: string
  action?: string
  autoid: string
  user?: string
  timestamp?: string
  data?: Record<string, unknown>
}

interface UseNotificationsWebSocketOptions {
  projectId: number | null
  enabled?: boolean
  showToasts?: boolean
}

function buildNotificationsWsUrl(projectId: number | null): string | null {
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

function getInvalidationKeys(entity: string): readonly (readonly unknown[])[] {
  switch (entity) {
    case 'order':
      return [ORDER_QUERY_KEYS.lists()]
    case 'proposal':
      return [PROPOSAL_QUERY_KEYS.lists()]
    default:
      return [
        ORDER_QUERY_KEYS.lists(),
        PROPOSAL_QUERY_KEYS.lists()
      ]
  }
}

function getToastMessage(payload: WSNotificationPayload): string {
  const { entity, action, autoid, type } = payload
  const entityLabel = entity === 'order' ? 'Order' : entity === 'proposal' ? 'Proposal' : entity
  const actionLabel =
    action ||
    (typeof type === 'string' && type.includes('_') ? type.split('_').slice(1).join('_') : 'updated')
  return `${entityLabel} ${autoid} ${actionLabel}`
}

function isNotificationPayload(
  msg: unknown
): msg is WSNotificationPayload & { entity: string; autoid: string } {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'entity' in msg &&
    'autoid' in msg &&
    typeof (msg as WSNotificationPayload).entity === 'string' &&
    typeof (msg as WSNotificationPayload).autoid === 'string' &&
    (msg as WSNotificationPayload).entity !== ''
  )
}

export function useNotificationsWebSocket({
  projectId,
  enabled = true,
  showToasts = true
}: UseNotificationsWebSocketOptions) {
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

      if (typeof msg === 'object' && msg !== null && 'type' in msg && (msg as { type: string }).type === 'pong') return

      if (isNotificationPayload(msg)) {
        const payload = msg as WSNotificationPayload
        const action = payload.action ?? (payload.type?.includes('_') ? payload.type.split('_').slice(1).join('_') : '')
        if (action === 'created' && (payload.entity === 'order' || payload.entity === 'proposal')) {
          resolvePendingCreatedAutoid(payload.entity, payload.autoid)
        }
        const keys = getInvalidationKeys(payload.entity)
        for (const queryKey of keys) {
          queryClient.invalidateQueries({ queryKey })
        }
        if (showToasts) {
          toast.info(getToastMessage(payload))
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
