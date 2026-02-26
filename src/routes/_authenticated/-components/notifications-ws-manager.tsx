import { useProjectId } from '@/hooks/use-project-id'
import { useNotificationsWebSocket } from '@/hooks/use-notifications-ws'

export function NotificationsWsManager() {
  const [projectId] = useProjectId()
  useNotificationsWebSocket({ projectId })
  return null
}
