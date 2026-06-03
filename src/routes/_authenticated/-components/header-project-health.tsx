import { HealthCell } from '@/components/common/project-health-cell'
import { isSuperAdmin } from '@/constants/user'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'
import { useProjectHealthWebSocket } from '@/hooks/use-project-health-ws'
import { useProjectId } from '@/hooks/use-project-id'
import { useAuth } from '@/providers/auth'

const HEALTH_SERVICES: { label: string; service: ProjectHealthService }[] = [
  { label: 'Frontend', service: 'website' },
  { label: 'Backend', service: 'backend' },
  { label: 'EBMS', service: 'ebms' },
  { label: 'Database', service: 'sync' }
]

export const HeaderProjectHealth = () => {
  const { user } = useAuth()
  const [projectId] = useProjectId()

  const userIsSuperAdmin = !!user?.role && isSuperAdmin(user.role)

  const { health, isConnected } = useProjectHealthWebSocket({ projectId })

  if (userIsSuperAdmin && projectId == null) return null

  return (
    <div className='flex items-center gap-4 rounded-md border border-border bg-bg-secondary/30 px-3 py-1.5'>
      <span className='text-[13px] font-medium text-text-tertiary'>Project health</span>
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
              <span className='text-[13px] text-text-tertiary'>{label}</span>
            </div>
          )
        })}
        <div className='flex items-center gap-1.5'>
          <HealthCell status={health?.overall_status ?? null} isLoading={!isConnected} />
          <span className='text-[13px] text-text-tertiary'>Status</span>
        </div>
      </div>
    </div>
  )
}
