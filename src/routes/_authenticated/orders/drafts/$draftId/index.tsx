import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { ChevronLeft, ExternalLink, RotateCcw, ScanText, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { DRAFT_ORDER_QUERY_KEYS, getDraftOrderQuery } from '@/api/draft-order/query'
import type { DraftLineItem, DraftOrder } from '@/api/draft-order/schema'
import { draftOrderService } from '@/api/draft-order/service'
import { PageEmpty } from '@/components/common/page-empty'
import { IDraftOrders, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getErrorMessage } from '@/helpers/error'
import { formatBytes } from '@/helpers/formatters'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'
import { DraftStatusBadge, isDraftInProgress } from '../-components/draft-constants'
import { DraftCustomerPicker } from './-components/draft-customer-picker'
import { DraftLineItems } from './-components/draft-line-items'

function DraftOrderDetailPage() {
  const { draftId } = Route.useParams()
  const id = Number(draftId)
  const [projectId] = useProjectId()

  const {
    data: draft,
    isLoading,
    error
  } = useQuery({
    ...getDraftOrderQuery(id, projectId),
    // Keep refreshing while the backend is extracting (v5 signature).
    refetchInterval: query => {
      const status = query.state.data?.status
      return status && isDraftInProgress(status) ? 2500 : false
    }
  })

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Link
          to='/orders/drafts'
          aria-label='Back to draft orders'
          className='flex size-6 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-100 hover:bg-bg-hover hover:text-foreground'
        >
          <ChevronLeft className='size-4' />
        </Link>
        <PageHeaderIcon icon={IDraftOrders} color={PAGE_COLORS.draftOrders} />
        <h1 className='min-w-0 truncate text-[14px] font-semibold tracking-[-0.01em]'>
          {draft?.file_name ?? `Draft #${draftId}`}
        </h1>
        {draft && <DraftStatusBadge status={draft.status} />}
        {draft?.created_by_email && (
          <span className='ml-auto hidden truncate text-[12px] text-text-tertiary sm:block'>
            {draft.created_by_email}
          </span>
        )}
      </header>

      {isLoading ? (
        <DetailSkeleton />
      ) : error || !draft ? (
        <PageEmpty
          icon={ScanText}
          title='Draft not found'
          description={error ? getErrorMessage(error) : 'This draft order does not exist.'}
          action={
            <Link to='/orders/drafts' className='text-[13px] font-medium text-primary'>
              Back to draft orders
            </Link>
          }
        />
      ) : (
        // Key-remount on status transitions (retry / extraction / confirm) so
        // local edits reseed. Deliberately NOT keyed on updated_at: a plain
        // save bumps it, and remounting then would drop keystrokes typed while
        // the save was in flight (and lose focus).
        <DraftReview key={`${draft.id}-${draft.status}`} draft={draft} projectId={projectId} />
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
      <div className='h-72 shrink-0 border-b border-border bg-bg-secondary p-4 lg:h-auto lg:w-[45%] lg:border-r lg:border-b-0'>
        <Skeleton className='size-full rounded' />
      </div>
      <div className='flex-1 space-y-4 p-4 sm:p-6'>
        <Skeleton className='h-7 w-48 rounded' />
        <Skeleton className='h-7 w-72 rounded' />
        <Skeleton className='h-40 w-full rounded' />
      </div>
    </div>
  )
}

// ── Review form (local editable state seeded from the draft) ─

function DraftReview({ draft, projectId }: { draft: DraftOrder; projectId: number | null }) {
  const queryClient = useQueryClient()

  const inProgress = isDraftInProgress(draft.status)
  const editable = draft.status === 'ready' || draft.status === 'failed'

  const [customerId, setCustomerId] = useState<string | null>(draft.customer_id)
  const [poNumber, setPoNumber] = useState(draft.extraction.po_number ?? '')
  const [orderDate, setOrderDate] = useState(draft.extraction.order_date ?? '')
  const [notes, setNotes] = useState(draft.extraction.notes ?? '')
  const [lines, setLines] = useState<DraftLineItem[]>(draft.line_items)
  const [dirty, setDirty] = useState(false)
  // Counts edits so a save only clears `dirty` when nothing changed mid-flight.
  const editsRef = useRef(0)

  const markDirty = () => {
    editsRef.current += 1
    setDirty(true)
  }

  const invalidateDraft = () => {
    queryClient.invalidateQueries({
      queryKey: DRAFT_ORDER_QUERY_KEYS.detail(draft.id, projectId)
    })
    queryClient.invalidateQueries({ queryKey: DRAFT_ORDER_QUERY_KEYS.lists() })
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      draftOrderService.update(
        draft.id,
        {
          customer_id: customerId,
          line_items: lines,
          extraction: {
            ...draft.extraction,
            po_number: poNumber || null,
            order_date: orderDate || null,
            notes: notes || null
          }
        },
        projectId
      ),
    meta: { successMessage: 'Draft saved' },
    onMutate: () => editsRef.current,
    onSuccess: (saved, _vars, editsAtSave) => {
      // Seed the cache from the PATCH response instead of refetching — the
      // mounted form keeps its local state, so edits typed during the save
      // (tracked via editsRef) survive and keep the dirty indicator on.
      queryClient.setQueryData(DRAFT_ORDER_QUERY_KEYS.detail(draft.id, projectId), saved)
      queryClient.invalidateQueries({ queryKey: DRAFT_ORDER_QUERY_KEYS.lists() })
      if (editsRef.current === editsAtSave) setDirty(false)
    }
  })

  const retryMutation = useMutation({
    mutationFn: () => draftOrderService.retry(draft.id, projectId),
    meta: { successMessage: 'Draft re-queued for extraction' },
    onSuccess: invalidateDraft
  })

  const confirmMutation = useMutation({
    mutationFn: () => draftOrderService.confirm(draft.id, projectId),
    onSuccess: ({ AUTOID }) => {
      toast.success(`Order ${AUTOID} created`)
      // Stay on the draft: the order detail page reads the mirror DB, which
      // lags EBMS by a few seconds — navigating straight to the new order
      // would 404. The refetched draft shows the confirmed banner with an
      // "Open order" link instead.
      queryClient.invalidateQueries({ queryKey: DRAFT_ORDER_QUERY_KEYS.all() })
    },
    onError: error => {
      // The global MutationCache toast already shows the backend message;
      // add the affected line numbers for the unmatched-product case.
      if (isAxiosError(error)) {
        const data = error.response?.data as
          | { error?: string; unmatched_indexes?: number[] }
          | undefined
        if (data?.unmatched_indexes?.length) {
          toast.error(
            `${data.error ?? 'Some lines have no matched product'} — line${
              data.unmatched_indexes.length === 1 ? '' : 's'
            } ${data.unmatched_indexes.map(i => i + 1).join(', ')}`
          )
        }
      }
    }
  })

  const unmatchedCount = lines.filter(line => !line.product_id).length
  const confirmBlocker =
    draft.status !== 'ready'
      ? 'Draft must finish extraction before confirming'
      : dirty
        ? 'Save your changes first'
        : !customerId
          ? 'Choose a customer first'
          : lines.length === 0
            ? 'Add at least one line item'
            : unmatchedCount > 0
              ? `${unmatchedCount} line${unmatchedCount === 1 ? '' : 's'} still need${unmatchedCount === 1 ? 's' : ''} a matched product`
              : null

  const confirmButton = (
    <Button
      size='sm'
      disabled={confirmBlocker !== null || confirmMutation.isPending}
      isPending={confirmMutation.isPending}
      onClick={() => confirmMutation.mutate()}
    >
      Create order
    </Button>
  )

  return (
    <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
      {/* ── Left: original document ─────────────────────────── */}
      <div className='flex h-72 shrink-0 flex-col overflow-hidden border-b border-border bg-bg-secondary lg:h-auto lg:w-[45%] lg:border-r lg:border-b-0'>
        <div className='flex h-8 shrink-0 items-center gap-2 border-b border-border px-3'>
          <span className='min-w-0 truncate text-[12px] text-text-tertiary'>
            {draft.file_name} · {formatBytes(draft.file_size, 1)}
          </span>
          <a
            href={draft.file_url}
            target='_blank'
            rel='noreferrer'
            title='Open original in new tab'
            aria-label='Open original in new tab'
            className='ml-auto flex size-5.5 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-100 hover:bg-bg-active hover:text-foreground'
          >
            <ExternalLink className='size-3' />
          </a>
        </div>
        <div className='min-h-0 flex-1'>
          {draft.file_content_type === 'application/pdf' ? (
            <iframe title='document' src={draft.file_url} className='size-full border-0' />
          ) : (
            <a
              href={draft.file_url}
              target='_blank'
              rel='noreferrer'
              title='Click to open full size'
              className='flex size-full items-center justify-center overflow-hidden p-3'
            >
              <img
                src={draft.file_url}
                alt={draft.file_name}
                className='max-h-full max-w-full rounded border border-border object-contain'
              />
            </a>
          )}
        </div>
      </div>

      {/* ── Right: extracted order ──────────────────────────── */}
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='flex flex-col gap-5 p-4 sm:p-6'>
          {/* Status banner */}
          {inProgress && (
            <div className='flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-500/10 px-3 py-2.5 dark:border-blue-800'>
              <Spinner className='size-3.5 shrink-0 text-blue-600 dark:text-blue-400' />
              <div className='min-w-0'>
                <div className='text-[13px] font-medium text-blue-800 dark:text-blue-300'>
                  Extracting order data...
                </div>
                <div className='text-[12px] text-blue-700/80 dark:text-blue-400/80'>
                  AI is reading the document. This page refreshes automatically.
                </div>
              </div>
            </div>
          )}

          {draft.status === 'failed' && (
            <div className='flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-500/10 px-3 py-2.5 dark:border-red-800'>
              <TriangleAlert className='mt-0.5 size-3.5 shrink-0 text-red-600 dark:text-red-400' />
              <div className='min-w-0 flex-1'>
                <div className='text-[13px] font-medium text-red-800 dark:text-red-300'>
                  Extraction failed
                </div>
                <div className='text-[12px] break-words text-red-700/90 dark:text-red-400/90'>
                  {draft.error || 'Something went wrong while processing this document.'}
                </div>
              </div>
              <Button
                size='sm'
                variant='outline'
                className='shrink-0'
                isPending={retryMutation.isPending}
                disabled={retryMutation.isPending}
                onClick={() => retryMutation.mutate()}
              >
                <RotateCcw className='size-3' />
                Retry
              </Button>
            </div>
          )}

          {draft.status === 'confirmed' && (
            <div className='flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-500/10 px-3 py-2.5 dark:border-green-800'>
              <div className='min-w-0 flex-1 text-[13px] text-green-800 dark:text-green-300'>
                <span className='font-medium'>Order created</span>
                {draft.created_order_autoid && (
                  <span className='tabular-nums'> — {draft.created_order_autoid}</span>
                )}
              </div>
              {draft.created_order_autoid && (
                <Link
                  to='/orders/$orderId'
                  params={{ orderId: draft.created_order_autoid }}
                  className='shrink-0 text-[13px] font-medium text-green-800 underline underline-offset-2 hover:opacity-80 dark:text-green-300'
                >
                  Open order
                </Link>
              )}
            </div>
          )}

          {/* Form only once extraction produced something to review */}
          {!inProgress && (
            <>
              {/* Actions */}
              <div className='flex items-center gap-2'>
                {draft.extraction.model_used && (
                  <span className='min-w-0 truncate text-[12px] text-text-tertiary'>
                    Extracted by {draft.extraction.model_used}
                  </span>
                )}
                <div className='flex-1' />
                {dirty && (
                  <span className='flex items-center gap-1.5 text-[12px] text-amber-700 dark:text-amber-400'>
                    <span className='size-1.5 rounded-full bg-amber-500' />
                    Unsaved changes
                  </span>
                )}
                <Button
                  size='sm'
                  variant='outline'
                  disabled={!dirty || !editable || updateMutation.isPending}
                  isPending={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  Save
                </Button>
                {confirmBlocker ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>{confirmButton}</span>
                    </TooltipTrigger>
                    <TooltipContent side='bottom'>{confirmBlocker}</TooltipContent>
                  </Tooltip>
                ) : (
                  confirmButton
                )}
              </div>

              {/* Customer */}
              <section className='flex flex-col gap-1.5'>
                <SectionLabel>
                  Customer
                  {!customerId && draft.extraction.customer_ref && (
                    <span className='font-normal text-text-tertiary'>
                      {' '}
                      — on sheet: “{draft.extraction.customer_ref}”
                    </span>
                  )}
                </SectionLabel>
                <DraftCustomerPicker
                  value={customerId}
                  candidates={draft.customer_candidates}
                  projectId={projectId}
                  disabled={!editable}
                  onChange={next => {
                    setCustomerId(next)
                    markDirty()
                  }}
                />
              </section>

              {/* Header fields */}
              <section className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <FieldBlock label='PO number'>
                  <input
                    value={poNumber}
                    disabled={!editable}
                    onChange={e => {
                      setPoNumber(e.target.value)
                      markDirty()
                    }}
                    className={fieldInputCls}
                  />
                </FieldBlock>
                <FieldBlock label='Order date'>
                  <input
                    value={orderDate}
                    disabled={!editable}
                    placeholder='YYYY-MM-DD'
                    onChange={e => {
                      setOrderDate(e.target.value)
                      markDirty()
                    }}
                    className={fieldInputCls}
                  />
                </FieldBlock>
                <FieldBlock label='Notes' className='sm:col-span-2'>
                  <input
                    value={notes}
                    disabled={!editable}
                    onChange={e => {
                      setNotes(e.target.value)
                      markDirty()
                    }}
                    className={fieldInputCls}
                  />
                </FieldBlock>
              </section>

              {/* Line items */}
              <section className='flex flex-col gap-1.5'>
                <SectionLabel>
                  Line items
                  <span className='font-normal text-text-tertiary tabular-nums'>
                    {' '}
                    — {lines.length}
                  </span>
                </SectionLabel>
                <DraftLineItems
                  lines={lines}
                  projectId={projectId}
                  disabled={!editable}
                  onChange={next => {
                    setLines(next)
                    markDirty()
                  }}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Small bits ───────────────────────────────────────────────

const fieldInputCls =
  'h-7.5 w-full rounded-[5px] border border-border bg-background px-2 text-[13px] outline-none transition-[border-color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className='text-[12px] font-medium text-text-secondary'>{children}</div>
}

function FieldBlock({
  label,
  className,
  children
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className='text-[12px] font-medium text-text-secondary'>{label}</span>
      {children}
    </label>
  )
}

export const Route = createFileRoute('/_authenticated/orders/drafts/$draftId/')({
  component: DraftOrderDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `Draft Order ${params.draftId}` }]
  })
})
