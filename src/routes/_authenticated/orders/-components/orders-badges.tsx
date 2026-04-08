import { Check, Package, PackageCheck } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ── Pick Badge ──────────────────────────────────────────

export function PickBadge({ pickStatus }: { pickStatus?: string }) {
  if (!pickStatus) return null
  const match = pickStatus.match(/^(\d+)\/(\d+)$/)
  if (!match)
    return <span className='text-text-tertiary text-[11px] tabular-nums'>{pickStatus}</span>

  const picked = Number(match[1])
  const total = Number(match[2])
  if (total === 0) return null

  const allPicked = picked === total

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
            allPicked
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : picked > 0
                ? 'bg-primary/10 text-primary'
                : 'text-text-quaternary'
          )}
        >
          {allPicked ? <Check className='size-3' /> : <PackageCheck className='size-3' />}
          {pickStatus}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {allPicked ? 'All items picked' : `${picked} of ${total} items picked`}
      </TooltipContent>
    </Tooltip>
  )
}

// ── Packed Badge ────────────────────────────────────────────

export function PackedBadge({ packedStatus }: { packedStatus?: string }) {
  if (!packedStatus) return null
  const match = packedStatus.match(/^(\d+)\/(\d+)$/)
  if (!match)
    return <span className='text-text-tertiary text-[11px] tabular-nums'>{packedStatus}</span>

  const packed = Number(match[1])
  const total = Number(match[2])
  if (total === 0 || packed === 0) return null

  const allPacked = packed === total

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums',
            allPacked
              ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
              : 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
          )}
        >
          <Package className='size-3' />
          {packedStatus}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {allPacked ? 'All items packed' : `${packed} of ${total} items packed`}
      </TooltipContent>
    </Tooltip>
  )
}
