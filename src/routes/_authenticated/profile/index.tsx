import { Navigate, createFileRoute } from '@tanstack/react-router'
import { DangerZoneCard } from './-components/danger-zone-card'
import { ProfileInfoCard } from './-components/profile-info-card'
import { SecurityCard } from './-components/security-card'
import { AUTH_REDIRECTS } from '@/api/constants'
import { IUser, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/providers/auth'

const ProfilePage = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to={AUTH_REDIRECTS.logout} />
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IUser} color={PAGE_COLORS.profile} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>My Profile</h1>
        </div>
      </header>

      <div className='flex-1 overflow-y-auto'>
        <div className='mx-auto max-w-[560px] py-6 px-4'>
          <div className='overflow-hidden rounded-[10px] border border-border bg-background'>
            <ProfileInfoCard user={user} />
            <div className='border-t border-border'>
              <SecurityCard />
            </div>
            <div className='border-t border-border'>
              <DangerZoneCard user={user} />
            </div>
          </div>
        </div>
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
