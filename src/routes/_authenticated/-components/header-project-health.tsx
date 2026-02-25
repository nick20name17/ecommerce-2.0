import { HealthCell } from '@/components/common/project-health-cell'
import { isSuperAdmin } from '@/constants/user'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'
import { useProjectId } from '@/hooks/use-project-id'
import { useProjectHealthWebSocket } from '@/hooks/use-project-health-ws'
import { useAuth } from '@/providers/auth'

const HEALTH_SERVICES: { label: string; service: ProjectHealthService }[] = [
  { label: 'Frontend', service: 'website' },
  { label: 'Backend', service: 'backend' },
  { label: 'EBMS', service: 'ebms' },
  { label: 'Database', service: 'sync' }
]

export function HeaderProjectHealth() {
  const { user } = useAuth()
  const [projectId] = useProjectId()

  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)

  const { health, isConnected } = useProjectHealthWebSocket({ projectId })

  if (userIsSuperAdmin && projectId == null) return null

  return (
    <div className='border-border bg-muted/30 flex items-center gap-4 rounded-md border px-3 py-1.5'>
      <span className='text-muted-foreground text-xs font-medium'>Project health</span>
      <div className='flex items-center gap-3'>
        {HEALTH_SERVICES.map(({ label, service }) => {
          const details = health ? getServiceHealthDetails(health, service) : null
          return (
            <div key={service} className='flex items-center gap-1.5'>
              <HealthCell
                status={details?.status ?? null}
                responseMs={details?.responseMs}
                lastChecked={details?.lastChecked}
                isLoading={!isConnected}
              />
              <span className='text-muted-foreground text-xs'>{label}</span>
            </div>
          )
        })}
        <div className='flex items-center gap-1.5'>
          <HealthCell status={health?.overall_status ?? null} isLoading={!isConnected} />
          <span className='text-muted-foreground text-xs'>Status</span>
        </div>
      </div>
    </div>
  )
}
