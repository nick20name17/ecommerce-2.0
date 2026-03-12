import { Link } from '@tanstack/react-router'
import { LogOut, Moon, Sun, User } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { useTheme } from '@/providers/theme'

export const NavUser = () => {
  const { isMobile } = useSidebar()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const namePart = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
  const userName = namePart || user?.email || 'User'
  const userInitials = namePart
    ? namePart
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className='flex items-center gap-1.5 px-3 pb-3'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            className={cn(
              'flex h-[32px] min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px]',
              'transition-[background-color,color,transform] duration-100',
              'text-foreground/90 hover:bg-black/[0.04] active:scale-[0.98] dark:hover:bg-white/[0.04]',
              'focus-visible:outline-none',
            )}
          >
            <div className='flex size-[18px] shrink-0 items-center justify-center rounded-full bg-black/[0.08] text-[8px] font-semibold text-text-secondary dark:bg-white/[0.12]'>
              {userInitials}
            </div>
            <span className='flex-1 truncate'>{userName}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-[220px] rounded-lg p-1'
          side={isMobile ? 'bottom' : 'right'}
          align='end'
          sideOffset={6}
          style={{ boxShadow: 'var(--dropdown-shadow)' }}
        >
          <div className='flex items-center gap-2.5 px-2 py-2'>
            <div className='flex size-7 items-center justify-center rounded-full bg-black/[0.08] text-[13px] font-semibold text-text-secondary dark:bg-white/[0.12]'>
              {userInitials}
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-[13px] font-medium'>{userName}</span>
              <span className='truncate text-[13px] text-text-tertiary'>{user?.email}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className='cursor-pointer gap-2 rounded-md px-2 py-1.5 text-[13px]'>
              <Link to='/profile'>
                <User className='size-3.5 text-text-tertiary' />
                My Profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className='cursor-pointer gap-2 rounded-md px-2 py-1.5 text-[13px]'
          >
            <LogOut className='size-3.5 text-text-tertiary' />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme toggle */}
      <button
        type='button'
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className='flex size-[30px] shrink-0 items-center justify-center rounded-md text-text-tertiary transition-[background-color,color,transform] duration-100 hover:bg-black/[0.04] hover:text-text-secondary active:scale-[0.92] dark:hover:bg-white/[0.04]'
      >
        {isDark ? <Sun className='size-[14px]' /> : <Moon className='size-[14px]' />}
      </button>
    </div>
  )
}
