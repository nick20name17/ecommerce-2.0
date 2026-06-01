import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Copy, FileText, Layers, Package, Plus, Trash2, UserSquare } from 'lucide-react'
import { toast } from 'sonner'

import {
  DOCUMENT_TEMPLATE_QUERY_KEYS,
  getDocumentTemplatesQuery,
} from '@/api/document-template/query'
import type { DocumentTemplate, EntityType } from '@/api/document-template/schema'
import { documentTemplateService } from '@/api/document-template/service'
import { IDocuments, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Entity type → icon / label ──────────────────────────────

const ENTITY_META: Record<
  EntityType,
  { label: string; icon: React.FC<{ className?: string }>; tint: string }
> = {
  order: { label: 'Order', icon: Package, tint: 'bg-amber-500/15 text-amber-600' },
  proposal: { label: 'Proposal', icon: FileText, tint: 'bg-rose-500/15 text-rose-600' },
  customer: {
    label: 'Customer',
    icon: UserSquare,
    tint: 'bg-blue-500/15 text-blue-600',
  },
}

// ── Page ────────────────────────────────────────────────────

function DocumentsPage() {
  const [projectId] = useProjectId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    ...getDocumentTemplatesQuery({}, projectId),
    enabled: !!projectId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentTemplateService.delete(id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists() })
      toast.success('Template deleted')
    },
    onError: () => toast.error('Failed to delete template'),
  })

  const duplicateMutation = useMutation({
    mutationFn: (source: DocumentTemplate) =>
      documentTemplateService.create(
        {
          name: `Copy of ${source.name}`.slice(0, 120),
          description: source.description,
          entity_type: source.entity_type,
          accessible_from: source.accessible_from,
          page_size: source.page_size,
          orientation: source.orientation,
          page_margins: source.page_margins,
          logo_url: source.logo_url,
          layout: source.layout,
          is_active: source.is_active,
        },
        projectId
      ),
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists(),
      })
      toast.success('Template duplicated')
      navigate({
        to: '/documents/$templateId',
        params: { templateId: String(created.id) },
      })
    },
    onError: () => toast.error('Failed to duplicate template'),
  })

  if (!projectId) {
    return <ProjectEmptyState />
  }

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <PageHeaderIcon icon={IDocuments} color={PAGE_COLORS.documents} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Documents</h1>
        <div className='flex-1' />
        <button
          type='button'
          onClick={() => navigate({ to: '/documents/new' })}
          className='inline-flex h-7 items-center gap-1.5 rounded-[5px] bg-primary px-2.5 text-[12px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:bg-primary/90'
        >
          <Plus className='size-3.5' />
          New template
        </button>
      </header>

      {/* Body */}
      <div className='flex-1 overflow-auto'>
        {isLoading ? (
          <ListSkeleton />
        ) : !templates || templates.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className='divide-y divide-border'>
            {templates.map((t) => (
              <TemplateRow
                key={t.id}
                template={t}
                onDuplicate={() => duplicateMutation.mutate(t)}
                onDelete={() => {
                  if (
                    confirm(
                      `Delete template "${t.name}"? This cannot be undone.`
                    )
                  ) {
                    deleteMutation.mutate(t.id)
                  }
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Row ─────────────────────────────────────────────────────

function TemplateRow({
  template,
  onDuplicate,
  onDelete,
}: {
  template: DocumentTemplate
  onDuplicate: () => void
  onDelete: () => void
}) {
  const meta = ENTITY_META[template.entity_type]
  const Icon = meta.icon
  return (
    <li className='group flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-bg-hover sm:px-6'>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[6px]',
          meta.tint
        )}
      >
        <Icon className='size-4' />
      </div>

      <Link
        to='/documents/$templateId'
        params={{ templateId: String(template.id) }}
        className='flex min-w-0 flex-1 flex-col gap-0.5'
      >
        <div className='flex items-center gap-2'>
          <span className='truncate text-[13px] font-semibold text-foreground'>
            {template.name}
          </span>
          {!template.is_active && (
            <span className='inline-flex items-center rounded-full bg-bg-secondary px-1.5 py-px text-[10px] font-medium text-text-tertiary'>
              Disabled
            </span>
          )}
        </div>
        <div className='flex items-center gap-2 text-[11.5px] text-text-tertiary'>
          <span>{meta.label}</span>
          {template.accessible_from.length > 0 && (
            <>
              <span>·</span>
              <span className='truncate'>
                Print from: {template.accessible_from.join(', ')}
              </span>
            </>
          )}
        </div>
      </Link>

      <button
        type='button'
        onClick={onDuplicate}
        className='inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-all duration-[80ms] hover:bg-bg-hover hover:text-foreground group-hover:opacity-100'
        aria-label='Duplicate template'
        title='Duplicate'
      >
        <Copy className='size-3.5' />
      </button>
      <button
        type='button'
        onClick={onDelete}
        className='inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] text-text-tertiary opacity-0 transition-all duration-[80ms] hover:bg-bg-hover hover:text-destructive group-hover:opacity-100'
        aria-label='Delete template'
      >
        <Trash2 className='size-3.5' />
      </button>
    </li>
  )
}

// ── Empty states ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-5 px-6 py-12'>
      <div className='flex size-12 items-center justify-center rounded-[12px] bg-indigo-500/10 text-indigo-500'>
        <Layers className='size-6' />
      </div>
      <div className='flex max-w-[320px] flex-col items-center gap-1.5 text-center'>
        <h2 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>
          No document templates yet
        </h2>
        <p className='text-[13px] leading-snug text-text-tertiary'>
          Create reusable invoices, packing lists, shipping labels, and other
          printable documents from your order and proposal data.
        </p>
      </div>
      <Link
        to='/documents/new'
        className='inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:bg-primary/90'
      >
        <Plus className='size-3.5' />
        Create your first template
      </Link>
    </div>
  )
}

function ProjectEmptyState() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-5'>
      <div className='flex size-12 items-center justify-center rounded-[12px] bg-indigo-500/10 text-indigo-500'>
        <IDocuments className='size-6' />
      </div>
      <div className='flex flex-col items-center gap-1.5 text-center'>
        <h1 className='text-[16px] font-semibold tracking-[-0.02em] text-foreground'>
          Documents
        </h1>
        <p className='max-w-[280px] text-[13px] leading-snug text-text-tertiary'>
          Select a project in the sidebar to manage document templates.
        </p>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <ul className='divide-y divide-border'>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className='flex items-center gap-3 px-3.5 py-2.5 sm:px-6'>
          <Skeleton className='size-8 rounded-[6px]' />
          <div className='flex flex-1 flex-col gap-1.5'>
            <Skeleton className='h-3.5 w-44' />
            <Skeleton className='h-3 w-64' />
          </div>
        </li>
      ))}
    </ul>
  )
}

// ── Route ───────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/documents/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: DocumentsPage,
  head: () => ({
    meta: [{ title: 'Documents' }],
  }),
})
