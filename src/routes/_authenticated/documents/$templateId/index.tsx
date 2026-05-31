import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  DOCUMENT_TEMPLATE_QUERY_KEYS,
  getDocumentTemplateQuery,
} from '@/api/document-template/query'
import type {
  DocumentLayout,
  UpdateDocumentTemplatePayload,
} from '@/api/document-template/schema'
import { documentTemplateService } from '@/api/document-template/service'
import { IDocuments, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'

import { DesignerCanvas } from './-components/designer-canvas'
import { ensureLayout } from './-components/designer-types'

// ── Page ────────────────────────────────────────────────────

function DocumentEditorPage() {
  const { templateId } = Route.useParams()
  const id = Number(templateId)
  const [projectId] = useProjectId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: template, isLoading } = useQuery({
    ...getDocumentTemplateQuery(id, projectId),
    enabled: !!id && !!projectId,
  })

  // Editable local copy
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [layout, setLayout] = useState<DocumentLayout>({ pages: [{ elements: [] }] })

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setIsActive(template.is_active)
      setLayout(ensureLayout(template.layout))
    }
  }, [template])

  const isDirty = useMemo(() => {
    if (!template) return false
    return (
      name !== template.name ||
      description !== template.description ||
      isActive !== template.is_active ||
      JSON.stringify(layout) !== JSON.stringify(ensureLayout(template.layout))
    )
  }, [template, name, description, isActive, layout])

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateDocumentTemplatePayload) =>
      documentTemplateService.update(id, payload, projectId),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        DOCUMENT_TEMPLATE_QUERY_KEYS.detail(id, projectId),
        updated
      )
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists(),
      })
      toast.success('Saved')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentTemplateService.delete(id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists(),
      })
      toast.success('Template deleted')
      navigate({ to: '/documents' })
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (isLoading) return <EditorSkeleton />
  if (!template) return <NotFound onBack={() => navigate({ to: '/documents' })} />

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <button
          type='button'
          className='inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => navigate({ to: '/documents' })}
        >
          <ArrowLeft className='size-3.5' />
          <span className='hidden sm:inline'>Documents</span>
        </button>
        <PageHeaderIcon icon={IDocuments} color={PAGE_COLORS.documents} />
        <h1 className='truncate text-[14px] font-semibold tracking-[-0.01em]'>
          {template.name}
        </h1>
        <span className='hidden items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-tertiary sm:inline-flex'>
          {template.entity_type}
        </span>

        <div className='flex-1' />

        <button
          type='button'
          disabled
          title='Preview lands once the renderer is wired'
          className='inline-flex size-7 items-center justify-center rounded-[5px] border border-border bg-bg-secondary text-text-tertiary opacity-50 lg:h-7 lg:w-auto lg:gap-1.5 lg:px-2.5'
        >
          <Eye className='size-3.5' />
          <span className='hidden lg:inline'>Preview</span>
        </button>
        <button
          type='button'
          onClick={() =>
            saveMutation.mutate({
              name: name.trim(),
              description: description.trim(),
              is_active: isActive,
              layout,
            })
          }
          disabled={saveMutation.isPending || !isDirty}
          className='inline-flex size-7 items-center justify-center rounded-[5px] bg-primary text-primary-foreground transition-colors duration-[80ms] hover:bg-primary/90 disabled:opacity-50 lg:h-7 lg:w-auto lg:gap-1.5 lg:px-2.5'
        >
          <Save className='size-3.5' />
          <span className='hidden lg:inline'>
            {saveMutation.isPending ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
          </span>
        </button>
        <button
          type='button'
          onClick={() => {
            if (confirm(`Delete "${template.name}"? This cannot be undone.`)) {
              deleteMutation.mutate()
            }
          }}
          className='inline-flex size-7 items-center justify-center rounded-[5px] text-text-tertiary transition-colors duration-[80ms] hover:bg-bg-hover hover:text-destructive'
        >
          <Trash2 className='size-3.5' />
        </button>
      </header>

      {/* Body — properties form + designer canvas placeholder */}
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {/* Properties sidebar */}
        <aside className='hidden w-[280px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-bg-secondary/40 px-4 py-5 md:flex'>
          <PropField label='Name'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='h-8 w-full rounded-[5px] border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              maxLength={120}
            />
          </PropField>
          <PropField label='Description'>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='min-h-16 w-full resize-y rounded-[5px] border border-border bg-background px-2 py-1 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              maxLength={500}
            />
          </PropField>
          <PropField label='Entity'>
            <div className='text-[12.5px] text-text-tertiary'>
              {template.entity_type} (cannot be changed)
            </div>
          </PropField>
          <PropField label='Page size'>
            <div className='text-[12.5px] text-text-tertiary'>
              {template.page_size} · {template.orientation}
            </div>
          </PropField>
          <PropField label='Print from'>
            <div className='flex flex-wrap gap-1'>
              {template.accessible_from.length === 0 ? (
                <span className='text-[12px] italic text-text-tertiary'>
                  Not yet exposed
                </span>
              ) : (
                template.accessible_from.map((r) => (
                  <span
                    key={r}
                    className='inline-flex items-center rounded-full bg-bg-active px-2 py-0.5 text-[10.5px] font-medium text-text-secondary'
                  >
                    {r}
                  </span>
                ))
              )}
            </div>
          </PropField>
          <PropField label='Status'>
            <label className='flex cursor-pointer items-center gap-2'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className='size-3.5 accent-primary'
              />
              <span className='text-[12.5px]'>Active</span>
            </label>
          </PropField>
        </aside>

        {/* Designer canvas */}
        <DesignerCanvas
          layout={layout}
          onChange={setLayout}
          pageSize={template.page_size}
          orientation={template.orientation}
          pageMargins={template.page_margins}
        />
      </div>
    </div>
  )
}

// ── Small bits ──────────────────────────────────────────────

function PropField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[11px] font-semibold uppercase tracking-wider text-text-tertiary'>
        {label}
      </label>
      {children}
    </div>
  )
}

function EditorSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <Skeleton className='size-5' />
        <Skeleton className='h-6 w-20' />
        <Skeleton className='size-5 rounded-[6px]' />
        <Skeleton className='h-4 w-40' />
      </header>
      <div className='flex flex-1'>
        <aside className='hidden w-[280px] border-r border-border p-4 md:block'>
          <Skeleton className='h-32 w-full' />
        </aside>
        <div className='flex-1 p-8'>
          <Skeleton className='h-full w-full rounded-[12px]' />
        </div>
      </div>
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 px-6 text-center'>
      <h2 className='text-[15px] font-semibold text-foreground'>
        Template not found
      </h2>
      <p className='text-[13px] text-text-tertiary'>
        It may have been deleted or you don't have access.
      </p>
      <button
        type='button'
        onClick={onBack}
        className='mt-2 inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-border bg-bg-secondary px-3 text-[12.5px] font-medium text-text-secondary hover:bg-bg-active hover:text-foreground'
      >
        <ArrowLeft className='size-3.5' />
        Back to Documents
      </button>
    </div>
  )
}

// ── Route ───────────────────────────────────────────────────

export const Route = createFileRoute(
  '/_authenticated/documents/$templateId/'
)({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: DocumentEditorPage,
  head: ({ params }) => ({
    meta: [{ title: `Template ${params.templateId}` }],
  }),
})
