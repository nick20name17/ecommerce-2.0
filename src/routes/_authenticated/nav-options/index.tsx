import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import {
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  FlaskConical,
  Gift,
  Globe,
  Image,
  Link2,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Newspaper,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tiny custom icons matching reference exactly ────────────

type IC = React.FC<{ className?: string }>
const ip = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' } as const
const st = { stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const IcGrid: IC = ({ className }) => (
  <svg {...ip} className={className}><rect x='2' y='2' width='5' height='5' rx='1' {...st} /><rect x='9' y='2' width='5' height='5' rx='1' {...st} /><rect x='2' y='9' width='5' height='5' rx='1' {...st} /><rect x='9' y='9' width='5' height='5' rx='1' {...st} /></svg>
)
const IcBars: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M3 5h10M3 8h7M3 11h10' {...st} /></svg>
)
const IcCashFlow: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M4 12V7M8 12V4M12 12V8' {...st} strokeWidth={1.6} /></svg>
)
const IcBudget: IC = ({ className }) => (
  <svg {...ip} className={className}><rect x='2' y='3' width='12' height='10' rx='1.5' {...st} /><path d='M2 6.5h12' {...st} /></svg>
)
const IcRecurring: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M11.5 4.5A5 5 0 0 0 3.3 5M4.5 11.5a5 5 0 0 0 8.2-.5' {...st} /><path d='M11.5 2v2.5H9M4.5 14v-2.5H7' {...st} /></svg>
)
const IcCalendar: IC = ({ className }) => (
  <svg {...ip} className={className}><rect x='2.5' y='3' width='11' height='10.5' rx='1.5' {...st} /><path d='M5.5 1.5v3M10.5 1.5v3M2.5 7h11' {...st} /></svg>
)
const IcGear: IC = ({ className }) => (
  <svg {...ip} className={className}><circle cx='8' cy='8' r='2' {...st} /><path d='M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4' {...st} /></svg>
)
const IcClock: IC = ({ className }) => (
  <svg {...ip} className={className}><circle cx='8' cy='8' r='6' {...st} /><path d='M8 4.5V8l2.5 1.5' {...st} /></svg>
)
const IcCode: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M5 4L1.5 8 5 12M11 4l3.5 4L11 12' {...st} /></svg>
)
const IcImport: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M8 2v8M5 7l3 3 3-3M3 12h10' {...st} /></svg>
)
const IcFile: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M4.5 2h5l3 3v8.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z' {...st} /><path d='M9.5 2v3h3' {...st} /></svg>
)
const IcPen: IC = ({ className }) => (
  <svg {...ip} className={className}><path d='M11.5 2.5l2 2-8.5 8.5H3v-2l8.5-9Z' {...st} /></svg>
)

// ═══════════════════════════════════════════════════════════
// Panel 1 — Craftwork (leftmost in reference)
// ═══════════════════════════════════════════════════════════

function Panel1() {
  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* ── Header ── */}
      <div className='flex items-center gap-2.5 px-5 pt-5 pb-4'>
        <div className='flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-[13px] font-bold text-emerald-700'>C</div>
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-1.5'>
            <span className='text-[14px] font-bold text-gray-900'>Craftwork</span>
            <span className='rounded bg-amber-400/20 px-1.5 py-[1px] text-[9px] font-bold text-amber-700'>Pro</span>
          </div>
          <span className='text-[11px] text-gray-400'>20 employees</span>
        </div>
        <Bell className='size-[15px] text-gray-400' />
        <MoreHorizontal className='size-[15px] text-gray-400' />
      </div>

      {/* ── Add new button ── */}
      <div className='px-5 pb-4'>
        <button type='button' className='flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-gray-200 text-[13px] font-medium text-gray-500'>
          <Plus className='size-3.5' />
          Add new
        </button>
      </div>

      {/* ── Top nav items ── */}
      <div className='flex flex-col px-5'>
        {/* Updates */}
        <div className='flex h-[38px] items-center gap-3'>
          <Circle className='size-4 text-gray-400' />
          <span className='flex-1 text-[14px] text-gray-600'>Updates</span>
          <span className='rounded-[5px] bg-red-50 px-1.5 py-[1px] text-[11px] font-semibold text-red-500'>16</span>
        </div>
        {/* Members */}
        <div className='group flex h-[38px] items-center gap-3'>
          <Users className='size-4 text-gray-400' />
          <span className='flex-1 text-[14px] text-gray-600'>Members</span>
          <span className='flex items-center gap-1.5 opacity-0 group-hover:opacity-100'>
            <Settings className='size-3.5 text-gray-300' />
            <Plus className='size-3.5 text-gray-300' />
          </span>
        </div>
        {/* Settings */}
        <div className='flex h-[38px] items-center gap-3'>
          <Settings className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-600'>Settings</span>
        </div>
      </div>

      {/* ── Teamspaces ── */}
      <div className='mt-4 flex flex-1 flex-col overflow-auto'>
        <p className='mb-2 px-5 text-[11px] font-semibold text-gray-400'>Teamspaces</p>

        <div className='flex flex-col px-5'>
          {/* Team tasks */}
          <div className='flex h-[34px] items-center gap-3'>
            <Star className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Team tasks</span>
          </div>

          {/* Craftwork — expanded */}
          <div className='flex h-[34px] items-center gap-3'>
            <ChevronDown className='size-3.5 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Craftwork</span>
          </div>

          {/* Sub-items — indented under Craftwork */}
          <div className='ml-[14px] flex flex-col border-l border-gray-100 pl-[18px]'>
            <div className='flex h-[32px] items-center text-[14px] text-gray-500'>Orders</div>
            <div className='flex h-[32px] items-center text-[14px] text-gray-500'>Mails</div>
            <div className='-ml-[19px] flex h-[34px] items-center rounded-[8px] bg-gray-50 pl-[19px] text-[14px] font-semibold text-gray-900'>
              Stuff
            </div>
            <div className='flex h-[32px] items-center text-[14px] text-gray-500'>Affiliates</div>
            <div className='flex h-[32px] items-center text-[14px] text-gray-500'>Authors</div>
          </div>

          {/* Storytale */}
          <div className='flex h-[34px] items-center gap-3'>
            <Globe className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Storytale</span>
          </div>

          {/* Circa [dev] */}
          <div className='flex h-[34px] items-center gap-3'>
            <IcCode className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Circa [dev]</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className='flex flex-col gap-0.5 border-t border-gray-100 px-5 py-3'>
        <div className='flex h-[34px] items-center gap-3'>
          <IcGrid className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Templates</span>
        </div>
        <div className='flex h-[34px] items-center gap-3'>
          <IcImport className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Import</span>
        </div>
        <div className='flex h-[34px] items-center gap-3'>
          <Trash2 className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Trash</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Panel 2 — Finance app (second from left)
// ═══════════════════════════════════════════════════════════

function Panel2() {
  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* ── Header ── */}
      <div className='flex items-center gap-3.5 px-5 pt-5 pb-3'>
        <div className='flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-orange-400'>
          <span className='text-[14px] font-black text-white'>f</span>
        </div>
        <div className='flex-1' />
        <Search className='size-[15px] text-gray-400' />
        <Bell className='size-[15px] text-gray-400' />
      </div>

      {/* ── Nav items ── */}
      <nav className='flex flex-1 flex-col px-5 pt-1'>
        {([
          { icon: IcGrid, title: 'Dashboard', active: true },
          { icon: Wallet, title: 'Accounts' },
          { icon: IcBars, title: 'Transactions', badge: '24' },
          { icon: IcCashFlow, title: 'Cash Flow' },
          { icon: IcBudget, title: 'Budget' },
          { icon: IcRecurring, title: 'Recurring' },
          { icon: Circle, title: 'Goals', filled: true },
          { icon: TrendingUp, title: 'Investments' },
          { icon: MessageSquare, title: 'Advice', badge: '12' },
        ] as const).map((item) => (
          <div
            key={item.title}
            className={cn(
              'flex h-[38px] items-center gap-3',
              'active' in item && item.active ? 'font-medium text-gray-900' : 'text-gray-600'
            )}
          >
            {'filled' in item && item.filled
              ? <Circle className='size-4 fill-gray-800 text-gray-800' />
              : <item.icon className='size-4 text-gray-400' />
            }
            <span className='flex-1 text-[14px]'>{item.title}</span>
            {'badge' in item && item.badge && (
              <span className='text-[13px] text-gray-400'>{item.badge}</span>
            )}
          </div>
        ))}
      </nav>

      {/* ── Trial footer ── */}
      <div className='flex flex-col gap-3 border-t border-gray-100 px-5 py-4'>
        <div className='flex items-center justify-between'>
          <span className='text-[13px] font-medium text-gray-700'>Free trial</span>
          <span className='text-[13px] text-gray-400'>15 days left</span>
        </div>
        <div className='h-[5px] rounded-full bg-gray-100'>
          <div className='h-full w-[55%] rounded-full bg-emerald-500' />
        </div>
        <button type='button' className='flex h-[36px] w-full items-center justify-center rounded-[8px] border border-gray-200 text-[13px] font-medium text-gray-600'>
          Upgrade
        </button>
        <div className='flex items-center gap-2 text-[13px] font-medium text-emerald-600'>
          <Gift className='size-4' />
          <span>Get 1 Month Free</span>
        </div>
      </div>

      {/* ── Help + User ── */}
      <div className='border-t border-gray-100 px-5 py-3'>
        <div className='flex h-[38px] items-center gap-3'>
          <MessageSquare className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-600'>Help & Support</span>
        </div>
        <div className='mt-1 flex h-[42px] items-center gap-3'>
          <div className='flex size-8 items-center justify-center rounded-full bg-blue-100 text-[12px] font-bold text-blue-600'>J</div>
          <span className='flex-1 text-[14px] font-medium text-gray-800'>James</span>
          <ChevronDown className='size-3.5 text-gray-400' />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Panel 3 — Alien calendar app (third from left)
// ═══════════════════════════════════════════════════════════

function Panel3() {
  const sections = [
    {
      icon: IcCalendar,
      label: 'Calendar',
      items: ['General', 'Try calendar', 'Smart color-coding'],
    },
    {
      icon: IcGear,
      label: 'Integrations',
      items: ['Calendars', 'Rooms & contacts', 'Conferencing'],
    },
    {
      icon: IcClock,
      label: 'Scheduling',
      items: ['Working hours', 'Flexible events', 'Focus fuard', 'Scheduling links'],
    },
    {
      icon: User,
      label: 'Account',
      items: ['Profile', 'Emails', 'Plans & billing'],
    },
  ]

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* ── Header ── */}
      <div className='flex items-center gap-3 px-5 pt-5 pb-4'>
        <div className='flex size-10 items-center justify-center rounded-2xl bg-emerald-100 text-[15px] font-bold text-emerald-700'>A</div>
        <div className='flex flex-1 flex-col'>
          <div className='flex items-center gap-2'>
            <span className='text-[15px] font-bold text-gray-900'>Alien</span>
            <span className='rounded bg-violet-100 px-1.5 py-[1px] text-[9px] font-bold text-violet-600'>Pro</span>
          </div>
          <span className='text-[12px] text-gray-400'>@allen_01</span>
        </div>
        <MoreHorizontal className='size-4 text-gray-400' />
      </div>

      {/* ── Sections ── */}
      <nav className='flex flex-1 flex-col gap-5 overflow-auto px-5 py-1'>
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section header — icon + label */}
            <div className='flex h-[36px] items-center gap-2.5'>
              <section.icon className='size-[15px] text-gray-400' />
              <span className='text-[14px] font-semibold text-gray-800'>{section.label}</span>
            </div>
            {/* Sub-items — indented, no icons */}
            <div className='flex flex-col'>
              {section.items.map((item) => (
                <div key={item} className='flex h-[34px] items-center pl-[27px] text-[14px] text-gray-500'>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className='border-t border-gray-100 px-5 py-3'>
        <div className='flex h-[38px] items-center gap-3'>
          <LogOut className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-600'>Log out</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Panel 4 — Craftwork CMS (rightmost)
// ═══════════════════════════════════════════════════════════

function Panel4() {
  const downloadsSubs = ['Discounts', 'Orders', 'Customers', 'Reports', 'Settings', 'Sheed Editor', 'Commissions', 'Subscriptions']

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* ── Header ── */}
      <div className='flex items-center gap-2.5 px-5 pt-5 pb-3'>
        <div className='flex size-8 items-center justify-center rounded-xl bg-violet-100 text-[12px] font-bold text-violet-600'>C</div>
        <span className='flex-1 text-[14px] font-bold text-gray-900'>Craftwork</span>
        <Bell className='size-[15px] text-gray-400' />
      </div>

      {/* ── Add new ── */}
      <div className='px-5 pb-3'>
        <button type='button' className='flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[8px] border border-gray-200 text-[13px] font-medium text-gray-500'>
          <Plus className='size-3.5' />
          Add new
        </button>
      </div>

      {/* ── Top items ── */}
      <div className='flex flex-col px-5'>
        {/* Posts */}
        <div className='flex h-[38px] items-center gap-3'>
          <IcPen className='size-4 text-gray-400' />
          <span className='flex-1 text-[14px] text-gray-600'>Posts</span>
          <span className='rounded-[5px] bg-orange-50 px-1.5 py-[1px] text-[11px] font-semibold text-orange-500'>16</span>
        </div>
        {/* Media */}
        <div className='group flex h-[38px] items-center gap-3'>
          <Image className='size-4 text-gray-400' />
          <span className='flex-1 text-[14px] text-gray-600'>Media</span>
          <span className='flex items-center gap-1.5 opacity-0 group-hover:opacity-100'>
            <Settings className='size-3.5 text-gray-300' />
            <Plus className='size-3.5 text-gray-300' />
          </span>
        </div>
        {/* Links */}
        <div className='flex h-[38px] items-center gap-3'>
          <Link2 className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-600'>Links</span>
        </div>
      </div>

      {/* ── Workflow section ── */}
      <div className='mt-3 flex flex-1 flex-col overflow-auto'>
        <p className='mb-1 px-5 text-[11px] font-semibold text-gray-400'>Workflow</p>

        <div className='flex flex-col px-5'>
          {/* Pages */}
          <div className='flex h-[38px] items-center gap-3'>
            <IcFile className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Pages</span>
          </div>

          {/* Downloads — expanded */}
          <div className='flex h-[38px] items-center gap-3'>
            <IcFile className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Downloads</span>
          </div>

          {/* Sub-items with left border */}
          <div className='ml-[14px] flex flex-col border-l border-gray-100 pl-[14px]'>
            {downloadsSubs.map((item) => {
              const isActive = item === 'Customers'
              return (
                <div
                  key={item}
                  className={cn(
                    'relative flex h-[32px] items-center text-[14px]',
                    isActive ? 'font-semibold text-gray-900' : 'text-gray-500'
                  )}
                >
                  {isActive && (
                    <div className='absolute -left-[15px] top-[8px] bottom-[8px] w-[2px] rounded-r bg-orange-400' />
                  )}
                  {item}
                </div>
              )
            })}
          </div>

          {/* Comments */}
          <div className='flex h-[38px] items-center gap-3'>
            <MessageSquare className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>Comments</span>
          </div>

          {/* News */}
          <div className='flex h-[38px] items-center gap-3'>
            <Newspaper className='size-4 text-gray-400' />
            <span className='text-[14px] text-gray-600'>News</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className='flex flex-col border-t border-gray-100 px-5 py-3'>
        <div className='flex h-[36px] items-center gap-3'>
          <User className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Profile</span>
        </div>
        <div className='flex h-[36px] items-center gap-3'>
          <Wrench className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Tools</span>
        </div>
        <div className='flex h-[36px] items-center gap-3'>
          <Settings className='size-4 text-gray-400' />
          <span className='text-[14px] text-gray-500'>Settings</span>
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────

const OPTIONS = [
  { id: 1, title: 'Craftwork', description: 'Tree nav, teamspaces, add-new button, collapsible sub-items', component: Panel1 },
  { id: 2, title: 'Finance', description: 'Icon list, badge counts, trial progress, upgrade CTA', component: Panel2 },
  { id: 3, title: 'Alien', description: 'Section headers with icons, indented text sub-items, minimal', component: Panel3 },
  { id: 4, title: 'CMS', description: 'Workflow tree, left-accent active, downloads sub-tree, badges', component: Panel4 },
]

function NavOptionsPage() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <FlaskConical className='size-4 shrink-0 text-text-tertiary' />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Testing</h1>
        <span className='text-[13px] text-text-tertiary'>Navigation options</span>
        <div className='flex-1' />
        {selected && (
          <div className='flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[12px] font-medium text-primary'>
            <Check className='size-3' />
            Option {selected}
          </div>
        )}
      </header>

      <div className='flex-1 overflow-y-auto px-6 py-5'>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'>
          {OPTIONS.map((option) => {
            const Component = option.component
            const isSelected = selected === option.id

            return (
              <button
                key={option.id}
                type='button'
                onClick={() => setSelected(option.id)}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-100',
                  isSelected
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-border hover:border-foreground/20 hover:shadow-md'
                )}
              >
                <div className='relative h-[540px] overflow-hidden'>
                  <Component />
                  {isSelected && (
                    <div className='absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-primary'>
                      <Check className='size-3 text-primary-foreground' />
                    </div>
                  )}
                </div>

                <div className='border-t border-border bg-background px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <span className='text-[11px] font-semibold tabular-nums text-text-tertiary'>
                      {String(option.id).padStart(2, '0')}
                    </span>
                    <span className='text-[13px] font-semibold'>{option.title}</span>
                  </div>
                  <p className='mt-0.5 text-[12px] text-text-tertiary'>{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/nav-options/')({
  component: NavOptionsPage
})
