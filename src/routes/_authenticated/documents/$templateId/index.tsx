import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Eye,
  FlaskConical,
  Redo2,
  Save,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  DOCUMENT_TEMPLATE_PRESETS,
  type DocumentTemplatePreset,
  materializePresetLayout
} from '@/api/document-template/presets'
import {
  DOCUMENT_TEMPLATE_QUERY_KEYS,
  getDocumentTemplateQuery
} from '@/api/document-template/query'
import type {
  AccessibleRouteKey,
  DocumentLayout,
  EntityType,
  UpdateDocumentTemplatePayload
} from '@/api/document-template/schema'
import { documentTemplateService } from '@/api/document-template/service'
import { getCustomerDetailQuery, getCustomersQuery } from '@/api/customer/query'
import { getFieldConfigQuery } from '@/api/field-config/query'
import { getOrderDetailQuery, getOrdersQuery } from '@/api/order/query'
import { getProposalDetailQuery, getProposalsQuery } from '@/api/proposal/query'
import { IDocuments, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

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
    enabled: !!id && !!projectId
  })

  // Field schema for the bound entity — drives the Field picker datalist.
  const { data: fieldConfig } = useQuery({
    ...getFieldConfigQuery(projectId),
    enabled: !!projectId
  })
  const availableFields = (() => {
    if (!template || !fieldConfig) return []
    return fieldConfig[template.entity_type] ?? []
  })()

  // Test-entity preview state. Three queries — only the one matching the
  // template's entity_type is enabled, so the others stay idle.
  const [testEntityId, setTestEntityId] = useState<string | null>(null)
  const { data: testOrder } = useQuery({
    ...getOrderDetailQuery(testEntityId ?? '', projectId),
    enabled: !!testEntityId && !!projectId && template?.entity_type === 'order'
  })
  const { data: testProposal } = useQuery({
    ...getProposalDetailQuery(testEntityId ?? '', projectId),
    enabled: !!testEntityId && !!projectId && template?.entity_type === 'proposal'
  })
  const { data: testCustomer } = useQuery({
    ...getCustomerDetailQuery(testEntityId ?? '', projectId),
    enabled: !!testEntityId && !!projectId && template?.entity_type === 'customer'
  })
  const entityData = ((): Record<string, unknown> | null => {
    if (!testEntityId || !template) return null
    if (template.entity_type === 'order')
      return (testOrder as Record<string, unknown> | undefined) ?? null
    if (template.entity_type === 'proposal')
      return (testProposal as Record<string, unknown> | undefined) ?? null
    if (template.entity_type === 'customer')
      return (testCustomer as Record<string, unknown> | undefined) ?? null
    return null
  })()

  // Editable local copy
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [layout, setLayoutRaw] = useState<DocumentLayout>({ pages: [{ elements: [] }] })
  const [pageSize, setPageSize] = useState<'letter' | 'a4' | 'label_4x6'>('letter')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [pageMargins, setPageMargins] = useState<{
    top?: number
    right?: number
    bottom?: number
    left?: number
  }>({})
  const [accessibleFrom, setAccessibleFrom] = useState<string[]>([])

  // ── Undo / redo history ──────────────────────────────────
  // Coalesces rapid layout changes (a drag fires ~30 setLayouts; with the
  // 300ms debounce that turns into 1 history entry per discrete edit).
  const HISTORY_CAP = 50
  const [past, setPast] = useState<DocumentLayout[]>([])
  const [future, setFuture] = useState<DocumentLayout[]>([])
  const lastCommitRef = useRef<DocumentLayout | null>(null)
  const commitTimerRef = useRef<number | null>(null)

  // Wrap setLayout so callers can pass either a value or an updater function.
  const setLayout = (next: DocumentLayout | ((prev: DocumentLayout) => DocumentLayout)) => {
    setLayoutRaw(prev =>
      typeof next === 'function' ? (next as (p: DocumentLayout) => DocumentLayout)(prev) : next
    )
  }

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setIsActive(template.is_active)
      setPageSize(template.page_size)
      setOrientation(template.orientation)
      setPageMargins(template.page_margins ?? {})
      setAccessibleFrom(template.accessible_from ?? [])
      const initial = ensureLayout(template.layout)
      setLayoutRaw(initial)
      lastCommitRef.current = initial
      setPast([])
      setFuture([])
    }
  }, [template])

  // Debounced history commit. When layout settles (no changes for 300ms),
  // the previous "committed" snapshot is pushed onto past and the future
  // is cleared.
  useEffect(() => {
    if (lastCommitRef.current === null) return
    if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current)
    commitTimerRef.current = window.setTimeout(() => {
      const lastJson = JSON.stringify(lastCommitRef.current)
      const currentJson = JSON.stringify(layout)
      if (lastJson === currentJson) return
      const prevCommit = lastCommitRef.current
      lastCommitRef.current = layout
      setPast(p => [...p.slice(-(HISTORY_CAP - 1)), prevCommit as DocumentLayout])
      setFuture([])
    }, 300)
    return () => {
      if (commitTimerRef.current) window.clearTimeout(commitTimerRef.current)
    }
  }, [layout])

  const canUndo = past.length > 0
  const canRedo = future.length > 0

  const undo = () => {
    setPast(p => {
      if (p.length === 0) return p
      const previous = p[p.length - 1]
      setFuture(f => [layout, ...f].slice(0, HISTORY_CAP))
      setLayoutRaw(previous)
      lastCommitRef.current = previous
      // Reset the pending commit timer — we just jumped, no debounce needed.
      if (commitTimerRef.current) {
        window.clearTimeout(commitTimerRef.current)
        commitTimerRef.current = null
      }
      return p.slice(0, -1)
    })
  }

  const redo = () => {
    setFuture(f => {
      if (f.length === 0) return f
      const next = f[0]
      setPast(p => [...p, layout].slice(-HISTORY_CAP))
      setLayoutRaw(next)
      lastCommitRef.current = next
      if (commitTimerRef.current) {
        window.clearTimeout(commitTimerRef.current)
        commitTimerRef.current = null
      }
      return f.slice(1)
    })
  }

  /**
   * Replace this template's layout + page setup with a preset's. Undo'able,
   * so the user can revert if they didn't mean it.
   */
  const applyPreset = (preset: DocumentTemplatePreset) => {
    if (!confirm(`Replace this template's layout with "${preset.label}"? You can undo with ⌘Z.`)) {
      return
    }
    const fresh = materializePresetLayout(preset)
    setLayout(fresh)
    setPageSize(preset.page_size)
    setOrientation(preset.orientation)
    if (preset.page_margins) setPageMargins(preset.page_margins)
    setAccessibleFrom(preset.defaultAccessibleFrom as AccessibleRouteKey[])
    toast.success(`Applied "${preset.label}"`)
  }

  // Keyboard shortcuts — Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z (or Ctrl+Y) = redo.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      // Don't steal undo from text inputs / textareas — they have native undo.
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === 'z' && !e.shiftKey) {
        if (!canUndo) return
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        if (!canRedo) return
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, canUndo, canRedo])

  const isDirty = (() => {
    if (!template) return false
    return (
      name !== template.name ||
      description !== template.description ||
      isActive !== template.is_active ||
      pageSize !== template.page_size ||
      orientation !== template.orientation ||
      JSON.stringify(pageMargins) !== JSON.stringify(template.page_margins ?? {}) ||
      JSON.stringify(accessibleFrom) !== JSON.stringify(template.accessible_from ?? []) ||
      JSON.stringify(layout) !== JSON.stringify(ensureLayout(template.layout))
    )
  })()

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateDocumentTemplatePayload) =>
      documentTemplateService.update(id, payload, projectId),
    onSuccess: updated => {
      queryClient.setQueryData(DOCUMENT_TEMPLATE_QUERY_KEYS.detail(id, projectId), updated)
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists()
      })
      toast.success('Saved')
    },
    onError: () => toast.error('Failed to save')
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentTemplateService.delete(id, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists()
      })
      toast.success('Template deleted')
      navigate({ to: '/documents' })
    },
    onError: () => toast.error('Failed to delete')
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
          className='inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pr-2.5 pl-1.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => navigate({ to: '/documents' })}
        >
          <ArrowLeft className='size-3.5' />
          <span className='hidden sm:inline'>Documents</span>
        </button>
        <PageHeaderIcon icon={IDocuments} color={PAGE_COLORS.documents} />
        <h1 className='truncate text-[14px] font-semibold tracking-[-0.01em]'>{template.name}</h1>
        <span className='hidden items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-tertiary sm:inline-flex'>
          {template.entity_type}
        </span>

        <div className='flex-1' />

        <TestEntityPicker
          entityType={template.entity_type}
          value={testEntityId}
          valueLabel={pickEntityLabel(template.entity_type, entityData)}
          onChange={setTestEntityId}
          projectId={projectId}
        />

        <div className='flex items-center'>
          <button
            type='button'
            disabled={!canUndo}
            onClick={undo}
            title='Undo (⌘Z)'
            className='inline-flex size-7 items-center justify-center rounded-l-[5px] border border-r-0 border-border bg-bg-secondary text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
          >
            <Undo2 className='size-3.5' />
          </button>
          <button
            type='button'
            disabled={!canRedo}
            onClick={redo}
            title='Redo (⌘⇧Z)'
            className='inline-flex size-7 items-center justify-center rounded-r-[5px] border border-border bg-bg-secondary text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
          >
            <Redo2 className='size-3.5' />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              title='Apply a preset (replaces current layout)'
              className='inline-flex size-7 items-center justify-center rounded-[5px] border border-border bg-bg-secondary text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground lg:h-7 lg:w-auto lg:gap-1.5 lg:px-2.5'
            >
              <Sparkles className='size-3.5 text-indigo-500' />
              <span className='hidden lg:inline'>Apply preset</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-72'>
            <DropdownMenuLabel className='text-[11px] tracking-wider text-text-tertiary uppercase'>
              Replace current layout
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DOCUMENT_TEMPLATE_PRESETS.filter(
              p => p.key !== 'blank' && p.entity_type === template.entity_type
            ).map(p => (
              <DropdownMenuItem
                key={p.key}
                onSelect={() => applyPreset(p)}
                className='flex flex-col items-start gap-0.5'
              >
                <span className='text-[13px] font-medium'>{p.label}</span>
                <span className='text-[11px] text-text-tertiary'>{p.description}</span>
              </DropdownMenuItem>
            ))}
            {DOCUMENT_TEMPLATE_PRESETS.filter(
              p => p.key !== 'blank' && p.entity_type === template.entity_type
            ).length === 0 && (
              <div className='px-3 py-2 text-[11.5px] text-text-tertiary italic'>
                No presets for {template.entity_type} entities yet.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
              page_size: pageSize,
              orientation,
              page_margins: pageMargins,
              accessible_from: accessibleFrom as UpdateDocumentTemplatePayload['accessible_from'],
              layout
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
              onChange={e => setName(e.target.value)}
              className='h-8 w-full rounded-[5px] border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              maxLength={120}
            />
          </PropField>
          <PropField label='Description'>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
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
            <select
              value={pageSize}
              onChange={e => setPageSize(e.target.value as typeof pageSize)}
              className='h-8 w-full rounded-[5px] border border-border bg-background px-2 text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
            >
              <option value='letter'>Letter (8.5×11 in)</option>
              <option value='a4'>A4 (210×297 mm)</option>
              <option value='label_4x6'>Shipping Label (4×6 in)</option>
            </select>
          </PropField>

          <PropField label='Orientation'>
            <div className='flex overflow-hidden rounded-[5px] border border-border bg-bg-secondary'>
              {(['portrait', 'landscape'] as const).map(o => (
                <button
                  key={o}
                  type='button'
                  onClick={() => setOrientation(o)}
                  className={cn(
                    'h-7 flex-1 text-[11.5px] font-medium capitalize transition-colors duration-[80ms]',
                    orientation === o
                      ? 'bg-primary text-primary-foreground'
                      : 'text-text-secondary hover:bg-bg-active hover:text-foreground'
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </PropField>

          <PropField label='Margins (in)'>
            <div className='grid grid-cols-2 gap-1.5'>
              {(['top', 'right', 'bottom', 'left'] as const).map(side => (
                <label
                  key={side}
                  className='flex flex-col gap-0.5 text-[10px] font-medium tracking-wider text-text-tertiary uppercase'
                >
                  {side}
                  <input
                    type='number'
                    step={0.125}
                    min={0}
                    max={4}
                    value={pageMargins[side] ?? 0}
                    onChange={e => {
                      const v = Number(e.target.value)
                      setPageMargins({
                        ...pageMargins,
                        [side]: Number.isFinite(v) && v >= 0 ? v : 0
                      })
                    }}
                    className='h-7 w-full rounded-[4px] border border-border bg-background px-1.5 text-[11.5px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'
                  />
                </label>
              ))}
            </div>
          </PropField>

          <PropField label='Print from'>
            <div className='flex flex-col gap-1'>
              {accessibleFromOptions(template.entity_type).map(opt => {
                const checked = accessibleFrom.includes(opt.value)
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-[5px] border px-2 py-1 text-[12px] transition-colors',
                      checked
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-border bg-bg-secondary hover:bg-bg-active'
                    )}
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={() => {
                        setAccessibleFrom(prev =>
                          prev.includes(opt.value)
                            ? prev.filter(v => v !== opt.value)
                            : [...prev, opt.value]
                        )
                      }}
                      className='size-3 accent-primary'
                    />
                    <span>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </PropField>
          <PropField label='Status'>
            <label className='flex cursor-pointer items-center gap-2'>
              <input
                type='checkbox'
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
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
          pageSize={pageSize}
          orientation={orientation}
          pageMargins={pageMargins}
          availableFields={availableFields}
          entityData={entityData}
          templateId={template.id}
          projectId={projectId}
        />
      </div>
    </div>
  )
}

// ── Small bits ──────────────────────────────────────────────

function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[11px] font-semibold tracking-wider text-text-tertiary uppercase'>
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
      <h2 className='text-[15px] font-semibold text-foreground'>Template not found</h2>
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

// ── Helpers ────────────────────────────────────────────────

function accessibleFromOptions(entityType: EntityType): { value: string; label: string }[] {
  if (entityType === 'order') {
    return [
      { value: 'order_detail', label: 'Order detail page' },
      { value: 'order_list', label: 'Orders list page' }
    ]
  }
  if (entityType === 'proposal') {
    return [
      { value: 'proposal_detail', label: 'Proposal detail page' },
      { value: 'proposal_list', label: 'Proposals list page' }
    ]
  }
  return [
    { value: 'customer_detail', label: 'Customer detail page' },
    { value: 'customer_list', label: 'Customers list page' }
  ]
}

// ── Test entity picker ──────────────────────────────────────

/** Pretty label for the picker button when a test entity is selected. */
function pickEntityLabel(
  entityType: EntityType,
  entityData: Record<string, unknown> | null
): string | null {
  if (!entityData) return null
  if (entityType === 'order') {
    return (
      (entityData.invoice as string | undefined) ||
      (entityData.name as string | undefined) ||
      (entityData.autoid as string | undefined) ||
      null
    )
  }
  if (entityType === 'proposal') {
    return (
      (entityData.quote as string | undefined) ||
      (entityData.b_name as string | undefined) ||
      (entityData.autoid as string | undefined) ||
      null
    )
  }
  if (entityType === 'customer') {
    return (
      (entityData.id as string | undefined) || (entityData.l_name as string | undefined) || null
    )
  }
  return null
}

type PickerRow = {
  /** The id passed to onChange — autoid for order/proposal, id for customer. */
  pickValue: string
  primary: string
  secondary: string
}

function TestEntityPicker({
  entityType,
  value,
  valueLabel,
  onChange,
  projectId
}: {
  entityType: EntityType
  value: string | null
  valueLabel: string | null
  onChange: (id: string | null) => void
  projectId: number | null
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // One query per entity type — only the matching one runs.
  const ordersQ = useQuery({
    ...getOrdersQuery({
      project_id: projectId ?? undefined,
      search: search || undefined,
      limit: 25
    }),
    enabled: open && entityType === 'order' && !!projectId
  })
  const proposalsQ = useQuery({
    ...getProposalsQuery({
      project_id: projectId ?? undefined,
      search: search || undefined,
      limit: 25
    }),
    enabled: open && entityType === 'proposal' && !!projectId
  })
  const customersQ = useQuery({
    ...getCustomersQuery({
      project_id: projectId ?? undefined,
      search: search || undefined,
      limit: 25
    }),
    enabled: open && entityType === 'customer' && !!projectId
  })

  const { rows, isLoading } = ((): {
    rows: PickerRow[]
    isLoading: boolean
  } => {
    if (entityType === 'order') {
      const orders = ordersQ.data?.results ?? []
      return {
        isLoading: ordersQ.isLoading,
        rows: orders.map(o => ({
          pickValue: o.autoid,
          primary: o.invoice || o.autoid,
          secondary: [o.name, o.status].filter(Boolean).join(' · ')
        }))
      }
    }
    if (entityType === 'proposal') {
      const proposals = proposalsQ.data?.results ?? []
      return {
        isLoading: proposalsQ.isLoading,
        rows: proposals.map(p => ({
          pickValue: p.autoid,
          primary: p.quote || p.autoid,
          secondary: [p.b_name, p.status].filter(Boolean).join(' · ')
        }))
      }
    }
    if (entityType === 'customer') {
      const customers = customersQ.data?.results ?? []
      return {
        isLoading: customersQ.isLoading,
        rows: customers.map(c => ({
          // Customer endpoints key off `id` (the EBMS customer id), not autoid.
          pickValue: c.id,
          primary: c.id || c.autoid,
          secondary: [c.l_name, c.city, c.state].filter(Boolean).join(' · ')
        }))
      }
    }
    return { rows: [], isLoading: false }
  })()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  const placeholder =
    entityType === 'order'
      ? 'Search by invoice # or customer…'
      : entityType === 'proposal'
        ? 'Search by quote # or customer…'
        : 'Search by customer ID or name…'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          title='Pick a real entity to preview field values'
          className={cn(
            'inline-flex h-7 max-w-[200px] items-center gap-1.5 truncate rounded-[5px] border px-2.5 text-[12px] font-medium transition-colors duration-[80ms] disabled:pointer-events-none disabled:opacity-50',
            value
              ? 'border-primary/30 bg-primary/[0.06] text-primary hover:bg-primary/[0.1]'
              : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active hover:text-foreground'
          )}
        >
          <FlaskConical className='size-3.5 shrink-0' />
          <span className='hidden truncate lg:inline'>
            {value ? (valueLabel ?? value) : 'Test data'}
          </span>
          {value && (
            <button
              type='button'
              onClick={e => {
                e.stopPropagation()
                onChange(null)
              }}
              className='-mr-1 inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] text-current opacity-70 hover:opacity-100'
              title='Clear test data'
            >
              <X className='size-3' />
            </button>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[300px] p-0'>
        <div className='flex items-center gap-2 border-b border-border px-2.5 py-1.5'>
          <Search className='size-3.5 text-text-tertiary' />
          <input
            ref={inputRef}
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={placeholder}
            className='h-7 w-full bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
          />
        </div>
        <div className='max-h-[300px] overflow-y-auto py-1'>
          {isLoading ? (
            <div className='px-3 py-4 text-[12px] text-text-tertiary'>Loading…</div>
          ) : rows.length === 0 ? (
            <div className='px-3 py-4 text-[12px] text-text-tertiary'>No matches</div>
          ) : (
            rows.map(row => (
              <button
                key={row.pickValue}
                type='button'
                onClick={() => {
                  onChange(row.pickValue)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left transition-colors hover:bg-bg-hover',
                  value === row.pickValue && 'bg-primary/[0.06]'
                )}
              >
                <span className='text-[12.5px] font-medium text-foreground'>{row.primary}</span>
                {row.secondary && (
                  <span className='truncate text-[11px] text-text-tertiary'>{row.secondary}</span>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ── Route ───────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/documents/$templateId/')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: DocumentEditorPage,
  head: ({ params }) => ({
    meta: [{ title: `Template ${params.templateId}` }]
  })
})
