import { useQuery } from '@tanstack/react-query'

import { getProjectHealthQuery } from '@/api/project/query'
import { HealthCell } from '@/components/common/project-health-cell'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'
import { useProjectId } from '@/hooks/use-project-id'

const HEALTH_SERVICES: { label: string; service: ProjectHealthService }[] = [
  { label: 'Frontend', service: 'website' },
  { label: 'Backend', service: 'backend' },
  { label: 'EBMS', service: 'ebms' },
  { label: 'Database', service: 'sync' }
]

export function HeaderProjectHealth() {
  const [projectId] = useProjectId()
  const { data: health, isLoading } = useQuery({
    ...getProjectHealthQuery(projectId!),
    enabled: projectId != null,
    meta: { suppressErrorToast: true }
  })

  if (projectId == null) return null

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
                isLoading={isLoading}
              />
              <span className='text-muted-foreground text-xs'>{label}</span>
            </div>
          )
        })}
        <div className='flex items-center gap-1.5'>
          <HealthCell status={health?.overall_status ?? null} isLoading={isLoading} />
          <span className='text-muted-foreground text-xs'>Status</span>
        </div>
      </div>
    </div>
  )
}
