import { Navigate, createFileRoute } from '@tanstack/react-router'
import { DangerZoneCard } from './-components/danger-zone-card'
import { PayloadLogsCard } from './-components/payload-logs-card'
import { ProfileInfoCard } from './-components/profile-info-card'
import { SecurityCard } from './-components/security-card'
import { AUTH_REDIRECTS } from '@/api/constants'
import { IUser, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { isSuperAdmin } from '@/constants/user'
import { useAuth } from '@/providers/auth'

const ProfilePage = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={AUTH_REDIRECTS.logout} />
  }

  const showLogs = isSuperAdmin(user.role)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IUser} color={PAGE_COLORS.profile} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>My Profile</h1>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto px-6 py-5'>
        {showLogs ? (
          <div className='grid items-start gap-4 lg:grid-cols-[380px_1fr]'>
            <div className='flex flex-col gap-4'>
              <ProfileInfoCard user={user} />
              <SecurityCard />
              <DangerZoneCard user={user} />
            </div>
            <PayloadLogsCard />
          </div>
        ) : (
          <div className='grid items-start gap-6 md:grid-cols-2'>
            <ProfileInfoCard user={user} />
            <div className='flex flex-col gap-4'>
              <SecurityCard />
              <DangerZoneCard user={user} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/profile/')({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: 'Profile' }]
  })
})
