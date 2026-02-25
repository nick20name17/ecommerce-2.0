import { useEffect, useRef, useState } from 'react'

import type { ProjectHealth } from '@/api/project/schema'
import { isSuperAdmin } from '@/constants/user'
import { getSession } from '@/helpers/auth'

const API_BASE_URL = 'https://api.store.rivne.app'

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

export function useProjectHealthWebSocket({
  projectId,
  enabled = true
}: UseProjectHealthWebSocketOptions) {
  const [health, setHealth] = useState<ProjectHealth | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled) return

    const session = getSession()
    if (!session?.access || !session?.user?.role) return

    const userIsSuperAdmin = isSuperAdmin(session.user.role)

    if (userIsSuperAdmin && projectId == null) return

    const wsBaseUrl = getWsUrl()
    const params = new URLSearchParams({ token: session.access })

    if (userIsSuperAdmin && projectId != null) {
      params.set('project_id', String(projectId))
    }

    const url = `${wsBaseUrl}/ws/project-health/?${params.toString()}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ProjectHealthWsMessage
      if (msg.type === 'health') setHealth(msg.data)
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [projectId, enabled])

  return { health, isConnected }
}
