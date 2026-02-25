import { useEffect, useRef, useState } from 'react'
import ReconnectingWebSocket from 'reconnecting-websocket'

import { API_ORIGIN } from '@/api/constants'
import type { ProjectHealth } from '@/api/project/schema'
import { isSuperAdmin } from '@/constants/user'
import { getSession } from '@/helpers/auth'

const RECONNECT_MIN_MS = 1000
const RECONNECT_MAX_MS = 30000
const RECONNECT_GROW_FACTOR = 2

function getWsOrigin(): string {
  return API_ORIGIN.replace(/^http/, 'ws')
}

interface ProjectHealthWsMessage {
  type: 'health'
  data: ProjectHealth
}

interface UseProjectHealthWebSocketOptions {
  projectId: number | null
  enabled?: boolean
}

function buildWsUrl(projectId: number | null): string | null {
  const session = getSession()
  if (!session?.access || !session?.user?.role) return null
  const userIsSuperAdmin = isSuperAdmin(session.user.role)
  if (userIsSuperAdmin && projectId == null) return null

  const wsBaseUrl = getWsOrigin()
  const params = new URLSearchParams({ token: session.access })
  if (userIsSuperAdmin && projectId != null) {
    params.set('project_id', String(projectId))
  }
  return `${wsBaseUrl}/ws/project-health/?${params.toString()}`
}

export function useProjectHealthWebSocket({
  projectId,
  enabled = true
}: UseProjectHealthWebSocketOptions) {
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const rwsRef = useRef<ReconnectingWebSocket | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const url = buildWsUrl(projectId)
    if (!url) return

    const rws = new ReconnectingWebSocket(url, [], {
      minReconnectionDelay: RECONNECT_MIN_MS,
      maxReconnectionDelay: RECONNECT_MAX_MS,
      reconnectionDelayGrowFactor: RECONNECT_GROW_FACTOR
    })
    rwsRef.current = rws

    rws.addEventListener('open', () => {
      if (mountedRef.current) setIsConnected(true)
    })
    rws.addEventListener('close', () => {
      if (mountedRef.current) setIsConnected(false)
    })
    rws.addEventListener('message', (event: MessageEvent) => {
      let msg: ProjectHealthWsMessage | null = null
      try {
        msg = JSON.parse(event.data as string) as ProjectHealthWsMessage
      } catch {
        // ignore parse errors
      }
      if (msg !== null && msg.type === 'health' && mountedRef.current) {
        setHealth(msg.data)
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
      rws.close()
      rwsRef.current = null
    }
  }, [projectId, enabled])

  return { health, isConnected }
}

