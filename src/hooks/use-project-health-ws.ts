import { useEffect, useRef, useState } from 'react'

import type { ProjectHealth } from '@/api/project/schema'
import { isSuperAdmin } from '@/constants/user'
import { getSession } from '@/helpers/auth'

const API_BASE_URL = 'https://api.store.rivne.app'
const RECONNECT_INITIAL_MS = 1000
const RECONNECT_MAX_MS = 30000
const RECONNECT_BACKOFF_MULTIPLIER = 2

function getWsUrl(): string {
  return API_BASE_URL.replace(/^http/, 'ws')
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

  const wsBaseUrl = getWsUrl()
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
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(RECONNECT_INITIAL_MS)
  const mountedRef = useRef(true)
  const connectRef = useRef<() => void>(() => {})

  // React Compiler memoizes; exhaustive-deps doesn't know that
  // eslint-disable-next-line react-hooks/exhaustive-deps -- compiler-memoized
  const connect = () => {
    if (!enabled) return
    const url = buildWsUrl(projectId)
    if (!url) return

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (mountedRef.current) {
        setIsConnected(true)
        reconnectDelayRef.current = RECONNECT_INITIAL_MS
      }
    }
    ws.onclose = () => {
      if (!mountedRef.current) return
      const wasActive = wsRef.current === ws
      if (wasActive) {
        wsRef.current = null
        setIsConnected(false)
      } else return

      const delay = reconnectDelayRef.current
      reconnectDelayRef.current = Math.min(
        delay * RECONNECT_BACKOFF_MULTIPLIER,
        RECONNECT_MAX_MS
      )
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null
        connectRef.current()
      }, delay)
    }
    ws.onerror = () => {
      ws.close()
    }
    ws.onmessage = (event) => {
      let msg: ProjectHealthWsMessage | null = null
      try {
        msg = JSON.parse(event.data) as ProjectHealthWsMessage
      } catch {
        // ignore parse errors
      }
      if (msg !== null && msg.type === 'health' && mountedRef.current) {
        setHealth(msg.data)
      }
    }
  }

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (buildWsUrl(projectId) == null) return

    connect()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wsRef.current?.readyState !== WebSocket.OPEN) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        reconnectDelayRef.current = RECONNECT_INITIAL_MS
        connect()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [projectId, enabled, connect])

  return { health, isConnected }
}
