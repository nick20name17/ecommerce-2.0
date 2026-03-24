import { createFileRoute } from '@tanstack/react-router'
import {
  Check,
  CircleDot,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'

import { IDev, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

type EntryStatus = 'done' | 'in-progress'
type EntryCategory = 'fix' | 'feature' | 'improvement'

interface ChangelogEntry {
  title: string
  description: string
  status: EntryStatus
  category: EntryCategory
}

// ── Data ─────────────────────────────────────────────────────

const CHANGELOG: ChangelogEntry[] = [
  // ── In Progress ──
  {
    title: 'EBMS shipment sync',
    description: 'Push shipment data (tracking, carrier, cost) to EBMS via OData API.',
    status: 'in-progress',
    category: 'feature',
  },
  {
    title: 'Editable fields & EBMS interactions',
    description: 'Add editable fields and sync changes with EBMS backend.',
    status: 'in-progress',
    category: 'feature',
  },
  {
    title: 'Filter presets',
    description: 'Saved filter presets with CRUD API, preset picker on list pages, and settings management.',
    status: 'in-progress',
    category: 'feature',
  },
  {
    title: 'Payment details',
    description: 'Ability to add and manage payment information on orders.',
    status: 'in-progress',
    category: 'feature',
  },
  {
    title: 'Responsive design',
    description: 'Tablet and mobile layout optimizations across all pages.',
    status: 'in-progress',
    category: 'improvement',
  },

  // ── Done ──
  {
    title: 'Assigned to me filter',
    description: 'Filter orders, proposals, and customers by current user assignment.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Assign API — filter & multi-assign endpoints',
    description: 'Backend ?assigned_to=me filter and assign/unassign/unassign-all endpoints.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Custom fields not displaying on orders page',
    description: 'Fixed missing custom field values in order detail view.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Price level field type',
    description: 'Dropdown pre-selection instead of manual string entry.',
    status: 'done',
    category: 'improvement',
  },
  {
    title: 'Order Desk — Ship To / Bill To fields',
    description: 'Display and edit shipping and billing addresses in sidebar.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Expand customer info on Order Desk',
    description: 'Full customer panel with contact, address, price level, and custom fields.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Catalogue — show to web products only',
    description: 'Limit product catalogue to only display show-to-web items.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Fix single ID search',
    description: 'Resolved issue where searching by a single product ID returned no results.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Fix multi UOM search for items',
    description: 'Fixed search to correctly handle products with multiple units of measure.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Edit Bill To / Ship To data',
    description: 'Compact address card with edit dialog on order pages.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Shipping rates saved on backend',
    description: 'Persist selected shipping rates to the backend on label purchase.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Void shipping functionality',
    description: 'Ability to void a shipping label and mark the shipment as voided.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Display all shippings across all orders',
    description: 'Dedicated shipping page with search and status filtering.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Display order-based shipping with filtering',
    description: 'Show shipments scoped to a specific order with filter controls.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Shipping page data not loading',
    description: 'Fixed response handling — API returns flat array, not paginated.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Shipping page filters redesign',
    description: 'Replaced segmented tabs with FilterPopover + FilterChip pattern.',
    status: 'done',
    category: 'improvement',
  },
  {
    title: 'Shipping page empty customer column',
    description: 'Graceful fallback to invoice or order ID when customer name is empty.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Shipments search not working',
    description: 'Client-side filtering across order name, invoice, tracking, service, and carrier.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Task activity author name showing "?"',
    description: 'Display author name with "Unknown" fallback, redesigned counter badge.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Cart empty state removed',
    description: 'Removed redundant empty state — the table itself serves as the empty state.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Task attachments redesign',
    description: 'Clean single-line rows with hover actions and compact drop zone.',
    status: 'done',
    category: 'improvement',
  },
  {
    title: 'Entity attachments hover layout fix',
    description: 'Fixed misplaced hover actions with opacity transition.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Users search not working',
    description: 'Client-side filtering by name and email.',
    status: 'done',
    category: 'fix',
  },
  {
    title: 'Field config "Editable" column redesign',
    description: 'Inline pencil icon toggle replacing separate column.',
    status: 'done',
    category: 'improvement',
  },
  {
    title: 'Smart boolean custom fields',
    description: 'Boolean values toggle on click with styled pill badges.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Order Desk customer info panel',
    description: 'Sidebar shows full customer details, contact, address, and custom fields.',
    status: 'done',
    category: 'feature',
  },
  {
    title: 'Bill To / Ship To redesign',
    description: 'Compact address card with edit dialog replacing inline accordion.',
    status: 'done',
    category: 'improvement',
  },
]

// ── Helpers ──────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<EntryCategory, { label: string; icon: typeof Wrench; color: string }> = {
  fix: { label: 'Fix', icon: Wrench, color: 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  feature: { label: 'Feature', icon: Sparkles, color: 'border-violet-200 bg-violet-500/10 text-violet-700 dark:border-violet-700 dark:bg-violet-500/20 dark:text-violet-300' },
  improvement: { label: 'Improve', icon: Zap, color: 'border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-700 dark:bg-sky-500/20 dark:text-sky-300' },
}

// ── Page Component ───────────────────────────────────────────

const DevPage = () => {
  const doneEntries = CHANGELOG.filter((e) => e.status === 'done')
  const inProgressEntries = CHANGELOG.filter((e) => e.status === 'in-progress')

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IDev} color={PAGE_COLORS.dev} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Development</h1>
        <span className='text-[13px] tabular-nums text-text-tertiary'>
          {CHANGELOG.length} item{CHANGELOG.length !== 1 ? 's' : ''}
        </span>
      </header>

      {/* List */}
      <div className='flex-1 overflow-y-auto'>
        {/* In Progress */}
        {inProgressEntries.length > 0 && (
          <>
            <div className='flex items-center gap-2 border-b border-border bg-bg-secondary/60 px-6 py-1.5'>
              <CircleDot className='size-3.5 text-amber-500' />
              <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
                In Progress ({inProgressEntries.length})
              </span>
            </div>
            {inProgressEntries.map((entry, i) => (
              <EntryRow key={`ip-${i}`} entry={entry} />
            ))}
          </>
        )}

        {/* Completed */}
        <div className='flex items-center gap-2 border-b border-border bg-bg-secondary/60 px-6 py-1.5'>
          <Check className='size-3.5 text-emerald-500' />
          <span className='text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary'>
            Completed ({doneEntries.length})
          </span>
        </div>
        {doneEntries.map((entry, i) => (
          <EntryRow key={`done-${i}`} entry={entry} />
        ))}
      </div>

      {/* Footer */}
      <div className='shrink-0 border-t border-border px-6 py-1.5'>
        <p className='text-[13px] tabular-nums text-text-tertiary'>
          {doneEntries.length} done · {inProgressEntries.length} in progress
        </p>
      </div>
    </div>
  )
}

// ── Entry Row ────────────────────────────────────────────────

function EntryRow({ entry }: { entry: ChangelogEntry }) {
  const cat = CATEGORY_CONFIG[entry.category]
  const CatIcon = cat.icon

  return (
    <div className='flex items-center gap-4 border-b border-border-light px-6 py-2 transition-colors duration-100 hover:bg-bg-hover'>
      {/* Status indicator */}
      <div className='shrink-0'>
        {entry.status === 'done' ? (
          <div className='flex size-5 items-center justify-center rounded-full bg-emerald-500'>
            <Check className='size-3 text-white' />
          </div>
        ) : (
          <div className='flex size-5 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/10'>
            <div className='size-2 animate-pulse rounded-full bg-amber-500' />
          </div>
        )}
      </div>

      {/* Content */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='text-[13px] font-medium text-foreground'>{entry.title}</span>
          <span className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none',
            cat.color,
          )}>
            <CatIcon className='size-2.5' />
            {cat.label}
          </span>
        </div>
        <p className='mt-0.5 text-[12px] text-text-tertiary'>{entry.description}</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/dev/')({
  component: DevPage,
  head: () => ({
    meta: [{ title: 'Development' }],
  }),
})
