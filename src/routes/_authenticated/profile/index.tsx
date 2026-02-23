import { Navigate, createFileRoute } from '@tanstack/react-router'
import { UserCircle } from 'lucide-react'

import { DangerZoneCard } from './-components/danger-zone-card'
import { PayloadLogsCard } from './-components/payload-logs-card'
import { ProfileInfoCard } from './-components/profile-info-card'
import { SecurityCard } from './-components/security-card'
import { AUTH_REDIRECTS } from '@/api/constants'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: 'Profile' }]
  })
})

function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={AUTH_REDIRECTS.logout} />
  }

  const showLogs = isSuperAdmin(user.role)

  if (showLogs) {
    return (
      <div className='flex h-full flex-col gap-5 overflow-y-auto p-1'>
        <header className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <UserCircle className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>My Profile</h1>
            <p className='text-sm text-muted-foreground'>Manage your account settings</p>
          </div>
        </header>

        <div className='grid h-220 items-start gap-4 lg:grid-cols-[380px_1fr]'>
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
    <div className='flex h-full flex-col gap-5 overflow-y-auto p-1'>
      <header className='flex items-center gap-3'>
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <UserCircle className='size-5' />
        </div>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>My Profile</h1>
          <p className='text-sm text-muted-foreground'>Manage your account settings</p>
        </div>
      </header>

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
