import { Navigate, createFileRoute } from '@tanstack/react-router'

import { DangerZoneCard } from './-components/danger-zone-card'
import { PayloadLogsCard } from './-components/payload-logs-card'
import { ProfileInfoCard } from './-components/profile-info-card'
import { SecurityCard } from './-components/security-card'
import { AUTH_REDIRECTS } from '@/api/constants'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfilePage
})

function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={AUTH_REDIRECTS.logout} />
  }

  const showLogs = isSuperAdmin(user.role)

  if (showLogs) {
    return (
      <div className='flex h-full flex-col gap-4'>
        <h1 className='text-2xl font-bold'>My Profile</h1>

        <div className='grid items-start gap-6 lg:grid-cols-[380px_1fr]'>
          <div className='flex flex-col gap-4'>
            <ProfileInfoCard user={user} />
            <SecurityCard />
            <DangerZoneCard user={user} />
          </div>

          <PayloadLogsCard />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-4 overflow-y-auto'>
      <h1 className='text-2xl font-bold'>My Profile</h1>

      <div className='grid items-start gap-6 md:grid-cols-2'>
        <ProfileInfoCard user={user} />
        <div className='flex flex-col gap-4'>
          <SecurityCard />
          <DangerZoneCard user={user} />
        </div>
      </div>
    </div>
  )
}
