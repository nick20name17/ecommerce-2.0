import type { DraftOrder, DraftOrderStatus } from '@/api/draft-order/schema'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

// ── Upload constraints (mirror backend validation) ───────────

export const DRAFT_UPLOAD_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf'

const DRAFT_UPLOAD_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf'
])

export const DRAFT_UPLOAD_MAX_SIZE = 10 * 1024 * 1024 // 10 MiB
export const DRAFT_UPLOAD_MAX_FILES = 20

/** Client-side pre-check matching the backend rules: mime whitelist + 10 MiB cap. */
export const splitUploadableFiles = (files: File[]) => {
  const accepted: File[] = []
  const rejected: string[] = []
  for (const file of files) {
    if (!DRAFT_UPLOAD_MIMES.has(file.type)) {
      rejected.push(`${file.name}: unsupported file type`)
    } else if (file.size > DRAFT_UPLOAD_MAX_SIZE) {
      rejected.push(`${file.name}: larger than 10 MB`)
    } else {
      accepted.push(file)
    }
  }
  return { accepted, rejected }
}

// ── Status badge ─────────────────────────────────────────────

export const DRAFT_STATUS_BADGE: Record<DraftOrderStatus, { label: string; cls: string }> = {
  queued: {
    label: 'Queued',
    cls: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800'
  },
  extracting: {
    label: 'Extracting',
    cls: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800'
  },
  ready: {
    label: 'Ready',
    cls: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800'
  },
  confirming: {
    label: 'Confirming',
    cls: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800'
  },
  confirmed: {
    label: 'Confirmed',
    cls: 'bg-bg-secondary text-text-tertiary border-border'
  },
  failed: {
    label: 'Failed',
    cls: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800'
  }
}

export const isDraftInProgress = (status: DraftOrderStatus) =>
  status === 'queued' || status === 'extracting' || status === 'confirming'

export function DraftStatusBadge({ status }: { status: DraftOrderStatus }) {
  const badge = DRAFT_STATUS_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium',
        badge.cls
      )}
    >
      {(status === 'extracting' || status === 'confirming') && <Spinner className='size-2.5' />}
      {badge.label}
    </span>
  )
}

// ── Small display helpers ────────────────────────────────────

export const draftCustomerLabel = (draft: DraftOrder) =>
  draft.customer_id || draft.extraction.customer_ref || null

export const formatScore = (score: number | null | undefined) =>
  score == null ? '—' : `${Math.round(score * 100)}%`
