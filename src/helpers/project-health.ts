export type ProjectHealthService = 'website' | 'backend' | 'ebms' | 'sync'

export interface ProjectHealthStatus {
  website_status?: 'healthy' | 'unhealthy'
  website_response_ms?: number
  website_last_checked?: string
  backend_status?: 'healthy' | 'unhealthy'
  backend_response_ms?: number
  backend_last_checked?: string
  ebms_status?: 'healthy' | 'unhealthy'
  ebms_response_ms?: number
  ebms_last_checked?: string
  sync_status?: 'healthy' | 'unhealthy'
  sync_response_ms?: number
  sync_last_checked?: string
  has_ebms_config?: boolean
  has_sync_config?: boolean
}

export function getServiceStatus(
  health: ProjectHealthStatus | null | undefined,
  service: ProjectHealthService
): 'healthy' | 'unhealthy' | null {
  if (!health) return null

  switch (service) {
    case 'website':
      return health.website_status ?? null
    case 'backend':
      return health.backend_status ?? null
    case 'ebms':
      return health.has_ebms_config ? (health.ebms_status ?? null) : null
    case 'sync':
      return health.has_sync_config ? (health.sync_status ?? null) : null
  }
}

export interface ServiceHealthDetails {
  status: 'healthy' | 'unhealthy' | null
  responseMs: number | undefined
  lastChecked: string | undefined
}

export function getServiceHealthDetails(
  project: ProjectHealthStatus,
  service: ProjectHealthService
): ServiceHealthDetails {
  const status = getServiceStatus(project, service)
  switch (service) {
    case 'website':
      return {
        status,
        responseMs: project.website_response_ms,
        lastChecked: project.website_last_checked,
      }
    case 'backend':
      return {
        status,
        responseMs: project.backend_response_ms,
        lastChecked: project.backend_last_checked,
      }
    case 'ebms':
      return {
        status,
        responseMs: project.ebms_response_ms,
        lastChecked: project.ebms_last_checked,
      }
    case 'sync':
      return {
        status,
        responseMs: project.sync_response_ms,
        lastChecked: project.sync_last_checked,
      }
  }
}
