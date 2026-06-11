import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, RotateCcw, ScanText, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { DRAFT_ORDER_QUERY_KEYS, getDraftOrdersQuery } from '@/api/draft-order/query'
import type { DraftOrder, DraftOrderStatus } from '@/api/draft-order/schema'
import { draftOrderService } from '@/api/draft-order/service'
import { Pagination } from '@/components/common/filters/pagination'
import { PageEmpty } from '@/components/common/page-empty'
import { IDraftOrders, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTimeShort } from '@/helpers/formatters'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'
import {
  DRAFT_UPLOAD_ACCEPT,
  DRAFT_UPLOAD_MAX_FILES,
  DraftStatusBadge,
  draftCustomerLabel,
  formatScore,
  isDraftInProgress,
  splitUploadableFiles
} from './-components/draft-constants'

// ── Status tabs ──────────────────────────────────────────────

type TabValue = 'all' | 'in_progress' | 'ready' | 'confirmed' | 'failed'

const STATUS_TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' }
]

// "In progress" spans two backend statuses, so it filters client-side.
const serverStatusFor = (tab: TabValue): DraftOrderStatus | undefined =>
  tab === 'all' || tab === 'in_progress' ? undefined : tab

function DraftOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId] = useProjectId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<TabValue>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [draftToDelete, setDraftToDelete] = useState<DraftOrder | null>(null)
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()

  const { data, isLoading } = useQuery({
    ...getDraftOrdersQuery({ status: serverStatusFor(tab), limit, offset }, projectId),
    placeholderData: keepPreviousData,
    // Poll while anything on screen is still being processed (v5 signature).
    refetchInterval: query => {
      const results = query.state.data?.results ?? []
      return results.some(d => isDraftInProgress(d.status)) ? 3000 : false
    }
  })

  const results = data?.results ?? []
  const rows = tab === 'in_progress' ? results.filter(d => isDraftInProgress(d.status)) : results
  // "In progress" is filtered client-side within the page, so only the
  // server-filtered tabs have a meaningful total.
  const totalCount = tab === 'in_progress' ? rows.length : (data?.count ?? 0)

  const selectTab = (next: TabValue) => {
    setTab(next)
    setOffset(null)
  }

  // ── Upload ─────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => draftOrderService.upload(files, projectId),
    onSuccess: created => {
      toast.success(
        `${created.length} document${created.length === 1 ? '' : 's'} queued for extraction`
      )
      queryClient.invalidateQueries({ queryKey: DRAFT_ORDER_QUERY_KEYS.lists() })
    }
  })

  const handleFiles = (fileList: FileList | File[]) => {
    const { accepted, rejected } = splitUploadableFiles(Array.from(fileList))
    rejected.forEach(msg => toast.error(msg))
    if (accepted.length === 0) return
    if (accepted.length > DRAFT_UPLOAD_MAX_FILES) {
      toast.error(`Max ${DRAFT_UPLOAD_MAX_FILES} files per upload`)
      return
    }
    uploadMutation.mutate(accepted)
  }

  // ── Row actions ────────────────────────────────────────────

  const retryMutation = useMutation({
    mutationFn: (id: number) => draftOrderService.retry(id, projectId),
    meta: {
      successMessage: 'Draft re-queued for extraction',
      invalidatesQuery: DRAFT_ORDER_QUERY_KEYS.lists()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => draftOrderService.delete(id, projectId),
    meta: {
      successMessage: 'Draft deleted',
      invalidatesQuery: DRAFT_ORDER_QUERY_KEYS.lists()
    },
    onSuccess: () => setDraftToDelete(null)
  })

  const openDraft = (draft: DraftOrder) =>
    navigate({ to: '/orders/drafts/$draftId', params: { draftId: String(draft.id) } })

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IDraftOrders} color={PAGE_COLORS.draftOrders} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Draft Orders</h1>
        <span className='ml-auto text-[12px] text-text-tertiary tabular-nums'>
          {totalCount > 0 && `${totalCount} draft${totalCount === 1 ? '' : 's'}`}
        </span>
        <input
          ref={fileInputRef}
          type='file'
          multiple
          accept={DRAFT_UPLOAD_ACCEPT}
          className='hidden'
          aria-label='Upload order documents'
          onChange={e => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type='button'
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
          className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2 text-[13px] font-semibold text-primary-foreground transition-colors duration-80 hover:opacity-90 disabled:opacity-60 sm:px-2.5'
        >
          {uploadMutation.isPending ? (
            <Spinner className='size-3.5' />
          ) : (
            <Upload className='size-3.5' />
          )}
          <span className='hidden sm:inline'>Upload</span>
        </button>
      </header>

      <div className='flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-3.5 sm:px-6'>
        {STATUS_TABS.map(t => {
          const active = tab === t.value
          return (
            <button
              key={t.value}
              type='button'
              onClick={() => selectTab(t.value)}
              className={cn(
                'h-7 shrink-0 rounded-md px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-80',
                active
                  ? 'bg-bg-active text-foreground'
                  : 'text-text-tertiary hover:bg-bg-hover hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div
        className={cn(
          'relative flex-1 overflow-y-auto',
          isDragging &&
            'after:pointer-events-none after:absolute after:inset-1 after:z-20 after:rounded-lg after:border-2 after:border-dashed after:border-primary after:bg-primary/5'
        )}
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={e => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
        }}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        }}
      >
        <div className='sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-bg-secondary px-3.5 py-1 text-[13px] font-medium text-text-tertiary select-none sm:px-6'>
          <div className='min-w-0 flex-1'>File</div>
          <div className='w-25 shrink-0'>Status</div>
          <div className='hidden w-36 shrink-0 md:block'>Customer</div>
          <div className='hidden w-14 shrink-0 text-right sm:block'>Lines</div>
          <div className='hidden w-20 shrink-0 text-right sm:block'>Confidence</div>
          <div className='hidden w-32 shrink-0 lg:block'>Created</div>
          <div className='w-16 shrink-0' />
        </div>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-6 border-b border-border-light px-3.5 py-2.5 sm:px-6'
            >
              <Skeleton className='h-3.5 flex-1 rounded' />
              <Skeleton className='h-3.5 w-25 rounded' />
              <Skeleton className='hidden h-3.5 w-36 rounded md:block' />
              <Skeleton className='hidden h-3.5 w-14 rounded sm:block' />
              <Skeleton className='hidden h-3.5 w-20 rounded sm:block' />
              <Skeleton className='hidden h-3.5 w-32 rounded lg:block' />
              <div className='w-16 shrink-0' />
            </div>
          ))
        ) : rows.length === 0 ? (
          <PageEmpty
            icon={ScanText}
            title='No draft orders'
            description='Upload photos, scans or PDFs of order sheets — each file becomes an editable draft order.'
            action={
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='inline-flex h-7 items-center gap-1 rounded-[5px] bg-primary px-2.5 text-[13px] font-semibold text-primary-foreground transition-colors duration-80 hover:opacity-90'
              >
                <Upload className='size-3.5' />
                Upload documents
              </button>
            }
          />
        ) : (
          rows.map(draft => (
            <DraftRow
              key={draft.id}
              draft={draft}
              onOpen={() => openDraft(draft)}
              onRetry={() => retryMutation.mutate(draft.id)}
              onDelete={() => setDraftToDelete(draft)}
              retryPending={retryMutation.isPending && retryMutation.variables === draft.id}
            />
          ))
        )}
      </div>

      <div className='shrink-0 border-t border-border px-3.5 py-2 sm:px-6'>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      <AlertDialog
        open={draftToDelete !== null}
        onOpenChange={open => !open && setDraftToDelete(null)}
      >
        <AlertDialogContent size='sm'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft?</AlertDialogTitle>
            <AlertDialogDescription>
              {draftToDelete
                ? `"${draftToDelete.file_name}" and its extracted data will be removed. This cannot be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              isPending={deleteMutation.isPending}
              onClick={() => draftToDelete && deleteMutation.mutate(draftToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Row ──────────────────────────────────────────────────────

function DraftRow({
  draft,
  onOpen,
  onRetry,
  onDelete,
  retryPending
}: {
  draft: DraftOrder
  onOpen: () => void
  onRetry: () => void
  onDelete: () => void
  retryPending: boolean
}) {
  const customer = draftCustomerLabel(draft)
  const avgConfidence = draft.extraction.avg_confidence
  const lowConfidence = avgConfidence != null && avgConfidence < 0.7

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => {
        if (e.key === 'Enter') onOpen()
      }}
      className='group/row flex w-full cursor-pointer items-center gap-6 border-b border-border-light px-3.5 py-2.5 text-left transition-colors duration-100 hover:bg-bg-hover sm:px-6'
    >
      <div className='min-w-0 flex-1'>
        <span className='block truncate text-[13px] font-medium text-foreground'>
          {draft.file_name}
        </span>
      </div>
      <div className='w-25 shrink-0'>
        <DraftStatusBadge status={draft.status} />
      </div>
      <div
        className={cn(
          'hidden w-36 shrink-0 truncate text-[13px] md:block',
          customer ? 'text-text-secondary' : 'text-text-tertiary'
        )}
      >
        {customer ?? '—'}
      </div>
      <div className='hidden w-14 shrink-0 text-right text-[13px] text-text-secondary tabular-nums sm:block'>
        {draft.line_items.length > 0 ? draft.line_items.length : '—'}
      </div>
      <div
        className={cn(
          'hidden w-20 shrink-0 text-right text-[13px] tabular-nums sm:block',
          lowConfidence ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-text-tertiary'
        )}
      >
        {formatScore(avgConfidence)}
      </div>
      <div className='hidden w-32 shrink-0 truncate text-[12px] text-text-tertiary tabular-nums lg:block'>
        {formatDateTimeShort(draft.created_at)}
      </div>
      <div className='flex w-16 shrink-0 items-center justify-end gap-0.5'>
        {draft.status === 'failed' && (
          <button
            type='button'
            title='Retry extraction'
            aria-label='Retry extraction'
            disabled={retryPending}
            onClick={e => {
              e.stopPropagation()
              onRetry()
            }}
            className='flex size-6 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-[opacity,background-color,color] duration-100 group-hover/row:opacity-100 hover:bg-bg-active hover:text-foreground'
          >
            {retryPending ? <Spinner className='size-3' /> : <RotateCcw className='size-3' />}
          </button>
        )}
        <button
          type='button'
          title='Delete draft'
          aria-label='Delete draft'
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          className='flex size-6 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-[opacity,background-color,color] duration-100 group-hover/row:opacity-100 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400'
        >
          <Trash2 className='size-3' />
        </button>
        <ChevronRight className='size-3.5 text-text-tertiary opacity-0 transition-opacity group-hover/row:opacity-100' />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/orders/drafts/')({
  component: DraftOrdersPage,
  head: () => ({
    meta: [{ title: 'Draft Orders' }]
  })
})
