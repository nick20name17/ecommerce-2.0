import { useMutation, useQuery } from '@tanstack/react-query'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

import { getDocumentTemplatesQuery } from '@/api/document-template/query'
import type {
  AccessibleRouteKey,
  EntityType,
} from '@/api/document-template/schema'
import { documentTemplateService } from '@/api/document-template/service'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PrintMenuProps {
  entityType: EntityType
  accessibleFrom: AccessibleRouteKey
  entityId: string
  projectId: number | null
  /** Compact = icon-only square button (for list rows). */
  compact?: boolean
  /** Pulled to the right of the action bar by default. Override align if needed. */
  align?: 'start' | 'end' | 'center'
  /** Hide entirely if no templates exist. Default true. */
  hideWhenEmpty?: boolean
  /** Optional extra className for the trigger button. */
  className?: string
  /** Stop click events from bubbling — useful inside <Link> rows. */
  stopPropagation?: boolean
}

/**
 * Reusable Print dropdown shared by entity detail pages and list rows.
 * Fetches templates matching {entityType, accessibleFrom, is_active=true};
 * on selection POSTs to /render/ and opens the returned PDF in a new tab.
 */
export function PrintMenu({
  entityType,
  accessibleFrom,
  entityId,
  projectId,
  compact = false,
  align = 'end',
  hideWhenEmpty = true,
  className,
  stopPropagation = false,
}: PrintMenuProps) {
  const { data: templates } = useQuery({
    ...getDocumentTemplatesQuery(
      { entity_type: entityType, accessible_from: accessibleFrom, is_active: true },
      projectId
    ),
    enabled: !!projectId,
  })

  const renderMutation = useMutation({
    mutationFn: async ({ templateId }: { templateId: number; templateName: string }) =>
      documentTemplateService.render(templateId, entityId, projectId),
    onSuccess: (blob, { templateName }) => {
      const url = URL.createObjectURL(blob)
      const w = window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      if (!w) {
        toast.error('Pop-up blocked. Allow pop-ups for this site to preview PDFs.')
      } else {
        toast.success(`Opened "${templateName}"`)
      }
    },
    onError: async (err: unknown) => {
      let msg = 'Failed to render document'
      const e = err as { response?: { data?: unknown } }
      const data = e.response?.data
      if (data instanceof Blob) {
        try {
          const text = await data.text()
          const parsed = JSON.parse(text) as { error?: string }
          if (parsed.error) msg = parsed.error
        } catch {
          // ignore
        }
      }
      toast.error(msg)
    },
  })

  if (hideWhenEmpty && (!templates || templates.length === 0)) {
    return null
  }

  const triggerClass = compact
    ? cn(
        'inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        className
      )
    : cn(
        'inline-flex size-7 items-center justify-center rounded-[5px] border border-border bg-bg-secondary text-[12px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-50 lg:h-7 lg:w-auto lg:gap-1.5 lg:px-2.5',
        className
      )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          disabled={renderMutation.isPending}
          className={triggerClass}
          title='Print document'
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation()
          }}
        >
          <Printer className='size-3.5' />
          {!compact && (
            <span className='hidden lg:inline'>
              {renderMutation.isPending ? 'Rendering…' : 'Print'}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className='w-56'
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation()
        }}
      >
        <DropdownMenuLabel className='text-[11px] uppercase tracking-wider text-text-tertiary'>
          Choose a template
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(templates ?? []).map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() =>
              renderMutation.mutate({
                templateId: t.id,
                templateName: t.name,
              })
            }
            className='flex flex-col items-start gap-0.5'
          >
            <span className='text-[13px] font-medium'>{t.name}</span>
            {t.description && (
              <span className='text-[11px] text-text-tertiary'>
                {t.description}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
