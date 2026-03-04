import { useNotificationsWebSocket } from '@/hooks/use-notifications-ws'
import { useProjectId } from '@/hooks/use-project-id'

export const NotificationsWsManager = () => {
  const [projectId] = useProjectId()
  useNotificationsWebSocket({ projectId })
  return null
}
