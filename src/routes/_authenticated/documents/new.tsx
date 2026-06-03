import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, FileText, Package, Sparkles, UserSquare } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  DOCUMENT_TEMPLATE_PRESETS,
  type DocumentTemplatePresetKey,
  getPresetByKey,
  presetToCreatePayload
} from '@/api/document-template/presets'
import { DOCUMENT_TEMPLATE_QUERY_KEYS } from '@/api/document-template/query'
import type {
  AccessibleRouteKey,
  CreateDocumentTemplatePayload,
  EntityType
} from '@/api/document-template/schema'
import { documentTemplateService } from '@/api/document-template/service'
import { IDocuments, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { isAdmin } from '@/constants/user'
import type { UserRole } from '@/constants/user'
import { getSession } from '@/helpers/auth'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'

// ── Entity choices ──────────────────────────────────────────

const ENTITY_CHOICES: {
  value: EntityType
  label: string
  description: string
  icon: React.FC<{ className?: string }>
  accessRoutes: { value: AccessibleRouteKey; label: string }[]
}[] = [
  {
    value: 'order',
    label: 'Order',
    description: 'Invoices, packing lists, shipping labels driven by ARINV data',
    icon: Package,
    accessRoutes: [
      { value: 'order_detail', label: 'Order detail page' },
      { value: 'order_list', label: 'Orders list page' }
    ]
  },
  {
    value: 'proposal',
    label: 'Proposal',
    description: 'Quotes and estimates driven by ARQT data',
    icon: FileText,
    accessRoutes: [
      { value: 'proposal_detail', label: 'Proposal detail page' },
      { value: 'proposal_list', label: 'Proposals list page' }
    ]
  },
  {
    value: 'customer',
    label: 'Customer',
    description: 'Customer-bound docs (statements, intake forms)',
    icon: UserSquare,
    accessRoutes: [
      { value: 'customer_detail', label: 'Customer detail page' },
      { value: 'customer_list', label: 'Customers list page' }
    ]
  }
]

// ── Page ────────────────────────────────────────────────────

function NewDocumentPage() {
  const [projectId] = useProjectId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [entityType, setEntityType] = useState<EntityType>('order')
  const [accessible, setAccessible] = useState<AccessibleRouteKey[]>(['order_detail'])
  const [description, setDescription] = useState('')
  const [presetKey, setPresetKey] = useState<DocumentTemplatePresetKey>('blank')

  const currentEntity = ENTITY_CHOICES.find(c => c.value === entityType)!

  const handleEntityChange = (next: EntityType) => {
    setEntityType(next)
    const entity = ENTITY_CHOICES.find(c => c.value === next)!
    // Default to "<entity>_detail" only
    setAccessible([entity.accessRoutes[0].value])
  }

  const handlePresetChange = (key: DocumentTemplatePresetKey) => {
    setPresetKey(key)
    const preset = getPresetByKey(key)
    if (!preset || key === 'blank') return
    // Preset overrides form fields so the user sees what's being created.
    setName(preset.defaultName)
    setDescription(preset.description)
    setEntityType(preset.entity_type)
    setAccessible(preset.defaultAccessibleFrom as AccessibleRouteKey[])
  }

  const toggleAccess = (key: AccessibleRouteKey) => {
    setAccessible(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]))
  }

  const createMutation = useMutation({
    mutationFn: (payload: CreateDocumentTemplatePayload) =>
      documentTemplateService.create(payload, projectId),
    onSuccess: created => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENT_TEMPLATE_QUERY_KEYS.lists()
      })
      toast.success('Template created')
      navigate({
        to: '/documents/$templateId',
        params: { templateId: String(created.id) }
      })
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? // axios shape
            ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            'Failed to create template')
          : 'Failed to create template'
      toast.error(msg)
    }
  })

  const canSubmit = name.trim().length > 0 && !createMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const preset = getPresetByKey(presetKey)
    if (preset && presetKey !== 'blank') {
      createMutation.mutate(
        presetToCreatePayload(preset, {
          name: name.trim(),
          description: description.trim(),
          accessible_from: accessible
        })
      )
    } else {
      createMutation.mutate({
        name: name.trim(),
        description: description.trim(),
        entity_type: entityType,
        accessible_from: accessible
      })
    }
  }

  if (!projectId) {
    return (
      <div className='flex h-full items-center justify-center px-6 text-[13px] text-text-tertiary'>
        Select a project in the sidebar to create a template.
      </div>
    )
  }

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
        <h1 className='truncate text-[14px] font-semibold tracking-[-0.01em]'>New template</h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className='flex-1 overflow-auto px-3.5 py-5 sm:px-6 sm:py-7'>
        <div className='mx-auto flex w-full max-w-xl flex-col gap-6'>
          {/* Preset picker */}
          <div className='flex flex-col gap-2'>
            <label className='inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground'>
              <Sparkles className='size-3.5 text-indigo-500' />
              Start from a preset
            </label>
            <p className='text-[11.5px] leading-snug text-text-tertiary'>
              Pick a starter to skip the blank canvas. You can edit anything after creating.
            </p>
            <div className='grid gap-2 sm:grid-cols-2'>
              {DOCUMENT_TEMPLATE_PRESETS.map(p => {
                const isActive = presetKey === p.key
                return (
                  <button
                    key={p.key}
                    type='button'
                    onClick={() => handlePresetChange(p.key)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-[8px] border p-3 text-left transition-colors duration-[80ms]',
                      isActive
                        ? 'border-primary bg-primary/[0.06] text-foreground'
                        : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active hover:text-foreground'
                    )}
                  >
                    <span className='text-[13px] font-semibold'>{p.label}</span>
                    <span className='text-[11.5px] leading-snug text-text-tertiary'>
                      {p.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name */}
          <div className='flex flex-col gap-1.5'>
            <label htmlFor='tpl-name' className='text-[12px] font-semibold text-foreground'>
              Name
            </label>
            <input
              id='tpl-name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. Plain Paper Invoice'
              className='h-9 rounded-[6px] border border-border bg-background px-2.5 text-[13px] text-foreground transition-colors duration-[80ms] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              autoFocus
              required
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className='flex flex-col gap-1.5'>
            <label htmlFor='tpl-desc' className='text-[12px] font-semibold text-foreground'>
              Description <span className='font-normal text-text-tertiary'>(optional)</span>
            </label>
            <textarea
              id='tpl-desc'
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder='What is this template used for?'
              className='min-h-16 resize-y rounded-[6px] border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground transition-colors duration-[80ms] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              maxLength={500}
            />
          </div>

          {/* Entity type */}
          <div className='flex flex-col gap-2'>
            <label className='text-[12px] font-semibold text-foreground'>Entity type</label>
            <p className='text-[11.5px] leading-snug text-text-tertiary'>
              Which kind of record does this template render? The designer will expose fields from
              this entity.
            </p>
            <div className='grid gap-2 sm:grid-cols-3'>
              {ENTITY_CHOICES.map(c => {
                const Icon = c.icon
                const isActive = entityType === c.value
                return (
                  <button
                    key={c.value}
                    type='button'
                    onClick={() => handleEntityChange(c.value)}
                    className={cn(
                      'flex flex-col items-start gap-1.5 rounded-[8px] border p-3 text-left transition-colors duration-[80ms]',
                      isActive
                        ? 'border-primary bg-primary/[0.06] text-foreground'
                        : 'border-border bg-bg-secondary text-text-secondary hover:bg-bg-active hover:text-foreground'
                    )}
                  >
                    <Icon className='size-4' />
                    <span className='text-[13px] font-semibold'>{c.label}</span>
                    <span className='text-[11.5px] leading-snug text-text-tertiary'>
                      {c.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accessible from */}
          <div className='flex flex-col gap-2'>
            <label className='text-[12px] font-semibold text-foreground'>Print from</label>
            <p className='text-[11.5px] leading-snug text-text-tertiary'>
              Where this template appears in the Print menu. Can be changed later.
            </p>
            <div className='flex flex-col gap-1.5'>
              {currentEntity.accessRoutes.map(r => {
                const checked = accessible.includes(r.value)
                return (
                  <label
                    key={r.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-[6px] border px-3 py-2 transition-colors duration-[80ms]',
                      checked
                        ? 'border-primary bg-primary/[0.06]'
                        : 'border-border bg-bg-secondary hover:bg-bg-active'
                    )}
                  >
                    <input
                      type='checkbox'
                      checked={checked}
                      onChange={() => toggleAccess(r.value)}
                      className='size-3.5 accent-primary'
                    />
                    <span className='text-[13px] text-foreground'>{r.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-2 pt-2'>
            <button
              type='button'
              onClick={() => navigate({ to: '/documents' })}
              className='inline-flex h-8 items-center rounded-[6px] border border-border bg-bg-secondary px-3 text-[12.5px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={!canSubmit}
              className='inline-flex h-8 items-center rounded-[6px] bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-colors duration-[80ms] hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50'
            >
              {createMutation.isPending ? 'Creating…' : 'Create template'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Route ───────────────────────────────────────────────────

export const Route = createFileRoute('/_authenticated/documents/new')({
  beforeLoad: () => {
    const session = getSession()
    const role = session?.user?.role as UserRole | undefined
    if (!role || !isAdmin(role)) {
      throw redirect({ to: '/', replace: true })
    }
  },
  component: NewDocumentPage,
  head: () => ({
    meta: [{ title: 'New document template' }]
  })
})
