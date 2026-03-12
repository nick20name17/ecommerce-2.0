import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Copy, FileText, ListTodo, Paperclip, Settings, ShoppingCart, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PageEmpty } from '@/components/common/page-empty'
import { EntityAttachmentsDialog } from '@/components/common/entity-attachments/entity-attachments-dialog'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { ORDER_QUERY_KEYS } from '@/api/order/query'
import { getProposalDetailQuery, PROPOSAL_QUERY_KEYS } from '@/api/proposal/query'
import { proposalService } from '@/api/proposal/service'
import { IProposals, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { UserCombobox } from '@/components/common/user-combobox/user-combobox'
import { CommandBarCreate } from '@/components/tasks/command-bar-create'
import { PROPOSAL_STATUS_CLASS, PROPOSAL_STATUS_LABELS } from '@/constants/proposal'
import type { ProposalStatus } from '@/constants/proposal'
import { getColumnLabel } from '@/helpers/dynamic-columns'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { formatCurrency, formatDate } from '@/helpers/formatters'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/proposals/$proposalId/')({
  component: ProposalDetailPage,
  head: () => ({
    meta: [{ title: 'Proposal Detail' }],
  }),
})

// ── Helpers ──────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  O: 'bg-blue-500',
  A: 'bg-green-500',
  L: 'bg-red-500',
  C: 'bg-slate-400',
  E: 'bg-amber-500',
  N: 'bg-violet-500',
  H: 'bg-slate-400',
}

// ── Page Component ───────────────────────────────────────────

function ProposalDetailPage() {
  const { proposalId } = Route.useParams()
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [projectId] = useProjectId()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [attachmentsOpen, setAttachmentsOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'general' | 'custom'>('general')

  const { data: proposal, isLoading } = useQuery(getProposalDetailQuery(proposalId, projectId))
  const { data: fieldConfig } = useQuery(getFieldConfigQuery(projectId))

  const assignMutation = useMutation({
    mutationFn: (userId: number | null) =>
      proposalService.assign(proposalId, { user_id: userId }, projectId),
    meta: {
      successMessage: 'Assignee updated',
      invalidatesQuery: PROPOSAL_QUERY_KEYS.all(),
    },
  })

  const toOrderMutation = useMutation({
    mutationFn: () => proposalService.toOrder(proposalId, projectId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.lists() })
      toast.success('Order created from proposal')
      navigate({
        to: '/orders/$orderId',
        params: { orderId: data.AUTOID },
      })
    },
    meta: { errorMessage: 'Failed to convert to order' },
  })

  const deleteMutation = useMutation({
    mutationFn: () => proposalService.delete(proposalId, projectId!),
    meta: {
      successMessage: 'Proposal deleted',
      invalidatesQuery: PROPOSAL_QUERY_KEYS.lists(),
    },
    onSuccess: () => router.history.back(),
  })

  // Custom fields
  const customFields = (fieldConfig?.proposal ?? []).filter((e) => !e.default && e.enabled)

  // Loading
  if (isLoading) {
    return (
      <div className='flex h-full flex-col overflow-hidden'>
        <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
          <Skeleton className='h-4 w-12' />
          <div className='mx-0.5 h-4 w-px bg-border' />
          <Skeleton className='size-5 rounded-[5px]' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-5 w-[72px] rounded-full' />
          <div className='flex-1' />
          <Skeleton className='size-7 rounded-[5px]' />
          <Skeleton className='size-7 rounded-[5px]' />
        </header>

        <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
          <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div className='flex items-center gap-3 border-b border-border bg-bg-secondary/60 py-1.5 pl-6 pr-6'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-32' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-8' />
              <Skeleton className='h-3 w-8' />
              <Skeleton className='h-3 w-14' />
            </div>
            <div className='flex-1'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 border-b border-border-light py-2 pl-6 pr-6'>
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-3 w-40' />
                  <div className='flex-1' />
                  <Skeleton className='h-3 w-8' />
                  <Skeleton className='h-3 w-8' />
                  <Skeleton className='h-3 w-16' />
                </div>
              ))}
            </div>
            <div className='flex shrink-0 items-center gap-5 border-t border-border bg-bg-secondary/40 px-6 py-2'>
              <Skeleton className='h-3 w-14' />
              <Skeleton className='h-3 w-14' />
              <div className='flex-1' />
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>

          {!isMobile && (
            <div className='w-[380px] shrink-0 border-l border-border bg-bg-secondary/50'>
              <div className='flex items-center gap-0 border-b border-border px-4'>
                <Skeleton className='my-2 h-4 w-14' />
                <Skeleton className='my-2 ml-4 h-4 w-14' />
              </div>
              <div className='space-y-3 px-4 py-3'>
                <Skeleton className='h-3 w-16' />
                <div className='grid grid-cols-2 gap-x-4 gap-y-2'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className='mb-1 h-2.5 w-12' />
                      <Skeleton className='h-3.5 w-full' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not found
  if (!proposal) {
    return (
      <div className='flex h-full items-center justify-center'>
        <PageEmpty icon={FileText} title='Proposal not found' description='This proposal may have been deleted or you may not have access.' />
      </div>
    )
  }

  const statusLabel = PROPOSAL_STATUS_LABELS[proposal.status as ProposalStatus] ?? proposal.status
  const dotColor = STATUS_DOT_COLORS[proposal.status] ?? 'bg-slate-400'
  const statusClass = PROPOSAL_STATUS_CLASS[proposal.status as ProposalStatus] ?? ''
  const items = proposal.items ?? []

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* ── Header bar ── */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-6'>
        <button
          type='button'
          className='flex items-center gap-1 text-[13px] font-medium text-text-tertiary transition-colors duration-[80ms] hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ChevronLeft className='size-4' />
          <span className='hidden sm:inline'>Proposals</span>
        </button>

        <div className='mx-0.5 h-4 w-px bg-border' />

        <PageHeaderIcon icon={IProposals} color={PAGE_COLORS.proposals} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
          {proposal.quote || `Proposal ${proposal.b_id}`}
        </h1>
        {proposal.quote && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className='inline-flex size-6 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground'
                onClick={() => {
                  navigator.clipboard.writeText(proposal.quote)
                  toast.success('Quote # copied')
                }}
              >
                <Copy className='size-3' />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy quote #</TooltipContent>
          </Tooltip>
        )}

        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-semibold leading-none',
            statusClass,
          )}
        >
          <span className={cn('size-1.5 rounded-full', dotColor)} />
          {statusLabel}
        </span>

        {/* Assignee */}
        <div className='hidden items-center gap-1.5 sm:flex'>
          <UserCombobox
            value={proposal.assigned_user?.id ?? null}
            onChange={(userId) => assignMutation.mutate(userId)}
            valueLabel={
              proposal.assigned_user
                ? `${proposal.assigned_user.first_name} ${proposal.assigned_user.last_name}`
                : undefined
            }
            role='sale'
            placeholder='Assign'
            triggerClassName='inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[13px] font-medium text-text-tertiary transition-colors duration-75 hover:bg-bg-hover cursor-pointer'
          />
        </div>

        <div className='flex-1' />

        {/* Convert to Order */}
        {projectId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
                onClick={() => toOrderMutation.mutate()}
                disabled={toOrderMutation.isPending}
              >
                <ShoppingCart className='size-3.5' />
                <span className='hidden sm:inline'>
                  {toOrderMutation.isPending ? 'Converting...' : 'Convert into Order'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Create order from this proposal</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setTaskModalOpen(true)}
            >
              <ListTodo className='size-3.5' />
              <span className='hidden sm:inline'>Create Task</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Create Task</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex h-7 items-center gap-1.5 rounded-[5px] border border-border bg-bg-secondary px-2.5 text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
              onClick={() => setAttachmentsOpen(true)}
            >
              <Paperclip className='size-3.5' />
              <span className='hidden sm:inline'>Attachments</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Attachments</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-3.5' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </header>

      {/* ── Main content area ── */}
      <div className={cn('flex min-h-0 flex-1', isMobile && 'flex-col')}>
        {/* Left: Line items */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <div className='flex-1 overflow-auto'>
            {items.length === 0 ? (
              <PageEmpty icon={FileText} title='No items in this proposal' compact />
            ) : (
              <table className='w-full text-[13px]'>
                <thead className='sticky top-0 z-10 select-none bg-bg-secondary/60 backdrop-blur-sm'>
                  <tr className='border-b border-border text-left'>
                    <th className='min-w-[100px] py-1.5 pl-6 pr-3 font-medium text-text-tertiary'>Inventory</th>
                    <th className='min-w-[200px] px-3 py-1.5 font-medium text-text-tertiary'>Description</th>
                    <th className='w-[70px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Qty</th>
                    <th className='w-[60px] px-3 py-1.5 text-right font-medium text-text-tertiary'>Unit</th>
                    <th className='w-[100px] py-1.5 pl-3 pr-6 text-right font-medium text-text-tertiary'>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.autoid ?? i}
                      className='border-b border-border-light transition-colors duration-100 hover:bg-bg-hover'
                    >
                      <td className='py-1.5 pl-6 pr-3 font-medium text-foreground'>
                        {item.inven || '—'}
                      </td>
                      <td className='max-w-[400px] px-3 py-1.5 text-text-secondary'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='block truncate'>{item.descr || '—'}</span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-[300px]'>{item.descr || '—'}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className='px-3 py-1.5 text-right tabular-nums text-text-secondary'>
                        {item.quan ?? '—'}
                      </td>
                      <td className='px-3 py-1.5 text-right text-text-tertiary'>
                        {item.unit || '—'}
                      </td>
                      <td className='py-1.5 pl-3 pr-6 text-right font-medium tabular-nums text-foreground'>
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary footer */}
          <div
            className={cn(
              'flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-bg-secondary/40',
              isMobile ? 'px-4 py-2' : 'px-6 py-2',
            )}
          >
            <SummaryCell label='Items' value={String(items.length)} />
            <div className='flex-1' />
            <SummaryCell label='Subtotal' value={formatCurrency(proposal.subtotal)} />
            <SummaryCell label='Tax' value={formatCurrency(proposal.tot_tax || proposal.tax)} />
            <SummaryCell label='Total' value={formatCurrency(proposal.total)} bold />
          </div>
        </div>

        {/* Right: Properties panel */}
        <div
          className={cn(
            'flex shrink-0 flex-col overflow-hidden bg-bg-secondary/50',
            isMobile
              ? 'border-t border-border'
              : 'w-[380px] border-l border-border',
          )}
        >
          {/* Panel tabs */}
          <div className='flex shrink-0 items-center gap-0 border-b border-border px-1'>
            {(['general', 'custom'] as const).map((tab) => (
              <button
                key={tab}
                type='button'
                className={cn(
                  'relative px-3 py-2 text-[13px] font-medium capitalize transition-colors duration-75',
                  panelTab === tab
                    ? 'text-foreground'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
                onClick={() => setPanelTab(tab)}
              >
                {tab}
                {tab === 'custom' && customFields.length > 0 && (
                  <span className='ml-1 text-[11px] text-text-quaternary'>{customFields.length}</span>
                )}
                {panelTab === tab && (
                  <span className='absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-primary' />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className='flex-1 overflow-y-auto px-4 py-3'>
            {panelTab === 'general' ? (
              <>
                <SectionLabel>Customer</SectionLabel>
                <div className='grid grid-cols-2 gap-x-4'>
                  <PropertyCell label='Name'>
                    <span className='text-[13px] font-medium text-foreground'>{proposal.b_name || '—'}</span>
                  </PropertyCell>
                  <PropertyCell label='Customer ID'>
                    <span className='text-[13px] tabular-nums text-foreground'>{proposal.b_id || '—'}</span>
                  </PropertyCell>
                </div>

                <SectionLabel>Proposal Details</SectionLabel>
                <div className='grid grid-cols-2 gap-x-4'>
                  <PropertyCell label='Quote'>
                    <span className='text-[13px] font-medium tabular-nums text-foreground'>{proposal.quote || '—'}</span>
                  </PropertyCell>
                  <PropertyCell label='Date'>
                    <span className='text-[13px] tabular-nums text-foreground'>{proposal.qt_date ? formatDate(proposal.qt_date) : '—'}</span>
                  </PropertyCell>
                </div>

                {proposal.descr && (
                  <>
                    <SectionLabel>Description</SectionLabel>
                    <p className='border-b border-border-light py-2 text-[13px] text-text-secondary'>{proposal.descr}</p>
                  </>
                )}
              </>
            ) : (
              <>
                {customFields.length === 0 ? (
                  <PageEmpty icon={Settings} title='No custom fields enabled' description='Enable fields in Settings &rarr; Data Control' compact />
                ) : (
                  <SectionLabel>Custom Fields</SectionLabel>
                )}
                <div className='grid grid-cols-2 gap-x-4'>
                  {customFields.map((entry) => {
                    const label = getColumnLabel(entry.field, 'proposal', fieldConfig)
                    const val = proposal[entry.field]
                    const strVal = val != null ? String(val) : null
                    return (
                      <PropertyCell key={entry.field} label={label}>
                        <span className='text-[13px] font-medium text-foreground'>{strVal ?? '—'}</span>
                      </PropertyCell>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Attachments dialog ── */}
      <EntityAttachmentsDialog
        entityType='proposal'
        entityLabel={proposal.quote || `Proposal ${proposal.b_id}`}
        autoid={proposalId}
        projectId={projectId}
        open={attachmentsOpen}
        onOpenChange={setAttachmentsOpen}
      />

      {/* ── Delete confirmation ── */}
      {deleteOpen && (
        <>
          <div className='fixed inset-0 z-40 bg-black/40' onClick={() => setDeleteOpen(false)} />
          <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
            <div
              className='w-full max-w-[400px] rounded-[12px] border border-border bg-background p-6'
              style={{ boxShadow: '0 16px 70px rgba(0,0,0,.2)' }}
            >
              <h3 className='mb-2 text-[15px] font-semibold'>Delete proposal</h3>
              <p className='mb-5 text-[13px] text-text-secondary'>
                Are you sure you want to delete proposal &ldquo;{proposal.quote || proposal.b_id}&rdquo;?
                This action cannot be undone.
              </p>
              <div className='flex justify-end gap-2'>
                <button
                  type='button'
                  className='rounded-[6px] border border-border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] hover:bg-bg-hover'
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='rounded-[6px] bg-destructive px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:opacity-90'
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Create Task command bar ── */}
      {taskModalOpen && (
        <CommandBarCreate
          onClose={() => setTaskModalOpen(false)}
          defaultLinkedProposalAutoid={proposal.autoid}
        />
      )}
    </div>
  )
}

// ── Section Label ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className='mt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary first:mt-0'>
      {children}
    </div>
  )
}

// ── Property Cell (read-only, stacked) ───────────────────────

function PropertyCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='border-b border-border-light py-2'>
      <span className='mb-0.5 block text-[12px] font-medium text-text-tertiary'>{label}</span>
      {children}
    </div>
  )
}

// ── Summary Cell ─────────────────────────────────────────────

function SummaryCell({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className='flex items-center gap-1.5'>
      <span className='text-[13px] text-text-tertiary'>{label}:</span>
      <span
        className={cn(
          'text-[13px] tabular-nums',
          bold ? 'font-semibold text-foreground' : 'font-medium text-text-secondary',
        )}
      >
        {value}
      </span>
    </div>
  )
}
