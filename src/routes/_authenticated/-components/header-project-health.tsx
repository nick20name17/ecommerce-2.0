import { useQuery } from '@tanstack/react-query'

import { getProjectHealthQuery } from '@/api/project/query'
import { HealthCell } from '@/components/common/project-health-cell'
import { type ProjectHealthService, getServiceHealthDetails } from '@/helpers/project-health'
import { useProjectIdParam } from '@/hooks/use-query-params'

const HEALTH_SERVICES: { label: string; service: ProjectHealthService }[] = [
  { label: 'Frontend', service: 'website' },
  { label: 'Backend', service: 'backend' },
  { label: 'EBMS', service: 'ebms' },
  { label: 'Database', service: 'sync' }
]

export function HeaderProjectHealth() {
  const [projectId] = useProjectIdParam()
  const { data: health, isLoading } = useQuery({
    ...getProjectHealthQuery(projectId!),
    enabled: projectId != null
  })

  if (projectId == null) return null

  return (
    <div className='border-border bg-muted/30 flex items-center gap-4 rounded-md border px-3 py-1.5'>
      <span className='text-muted-foreground text-xs font-medium'>Project health</span>
      {isLoading || !health ? (
        <span className='text-muted-foreground text-xs'>Loading…</span>
      ) : (
        <div className='flex items-center gap-3'>
          {HEALTH_SERVICES.map(({ label, service }) => {
            const { status, responseMs, lastChecked } = getServiceHealthDetails(health, service)
            return (
              <div key={service} className='flex items-center gap-1.5'>
                <HealthCell status={status} responseMs={responseMs} lastChecked={lastChecked} />
                <span className='text-muted-foreground text-xs'>{label}</span>
              </div>
            )
          })}
          <div className='flex items-center gap-1.5'>
            <HealthCell status={health.overall_status ?? null} />
            <span className='text-muted-foreground text-xs'>Status</span>
          </div>
        </div>
      )}
    </div>
  )
}
