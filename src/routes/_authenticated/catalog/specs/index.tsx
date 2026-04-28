import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Layers, Merge, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useDeferredValue, useState } from 'react'

import { getSpecsQuery, VP_QUERY_KEYS } from '@/api/variable-product/query'
import type { GlobalSpecDefinition, SpecDisplayType } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ICatalog, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { useProjectId } from '@/hooks/use-project-id'
import { cn } from '@/lib/utils'
import { SpecOptionsPanel } from './-components/spec-options-panel'

// ── Page ─────────────────────────────────────────────────────

const SpecsManagerPage = () => {
  const router = useRouter()
  const [projectId] = useProjectId()
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedSpec, setSelectedSpec] = useState<GlobalSpecDefinition | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editSpec, setEditSpec] = useState<GlobalSpecDefinition | null>(null)
  const [deleteSpec, setDeleteSpec] = useState<GlobalSpecDefinition | null>(null)
  const [mergeSpec, setMergeSpec] = useState<GlobalSpecDefinition | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState('')
  const [mergeSearch, setMergeSearch] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formDisplayType, setFormDisplayType] = useState<SpecDisplayType>('dropdown')
  const [formSortOrder, setFormSortOrder] = useState(0)

  const { data: rawData, isLoading } = useQuery(getSpecsQuery(params))
  const specs: GlobalSpecDefinition[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray((rawData as unknown as { results?: unknown[] })?.results)
      ? (rawData as unknown as { results: GlobalSpecDefinition[] }).results
      : []

  // Auto-select first spec when data loads
  useEffect(() => {
    if (specs.length > 0 && !selectedSpec) {
      setSelectedSpec(specs[0])
    }
  }, [specs, selectedSpec])

  const filteredSpecs = deferredSearch
    ? specs.filter((s) => s.name.toLowerCase().includes(deferredSearch.toLowerCase()))
    : specs

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specs() })
  }

  // ── Mutations ────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpec({ name: formName, display_type: formDisplayType, sort_order: formSortOrder }, params),
    meta: { successMessage: 'Spec created' },
    onSuccess: () => { invalidateAll(); setCreateOpen(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      variableProductService.updateSpec(editSpec!.id, { name: formName, display_type: formDisplayType, sort_order: formSortOrder }, params),
    meta: { successMessage: 'Spec updated' },
    onSuccess: () => { invalidateAll(); setEditSpec(null); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: () => variableProductService.deleteSpec(deleteSpec!.id, params),
    meta: { successMessage: 'Spec deleted' },
    onSuccess: () => {
      invalidateAll()
      setDeleteSpec(null)
      if (selectedSpec?.id === deleteSpec?.id) setSelectedSpec(null)
    },
  })

  const mergeMutation = useMutation({
    mutationFn: () =>
      variableProductService.mergeSpecs(mergeSpec!.id, { source_id: mergeTargetId }, params),
    meta: { successMessage: 'Specs merged' },
    onSuccess: () => { invalidateAll(); setMergeSpec(null); setMergeTargetId('') },
  })

  const resetForm = () => {
    setFormName('')
    setFormDisplayType('dropdown')
    setFormSortOrder(0)
  }

  const openEdit = (spec: GlobalSpecDefinition) => {
    setFormName(spec.name)
    setFormDisplayType(spec.display_type)
    setFormSortOrder(spec.sort_order)
    setEditSpec(spec)
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header className='flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3.5 sm:px-6'>
        <SidebarTrigger className='-ml-1' />
        <button
          type='button'
          className='inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[6px] border border-border bg-bg-secondary pl-1.5 pr-2.5 text-[13px] font-medium text-text-secondary transition-colors duration-[80ms] hover:bg-bg-active hover:text-foreground'
          onClick={() => router.history.back()}
        >
          <ArrowLeft className='size-3.5' />
          Catalog
        </button>
        <PageHeaderIcon icon={ICatalog} color={PAGE_COLORS.catalog} />
        <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>Specs Manager</h1>
        <span className='text-[13px] tabular-nums text-text-tertiary'>
          {isLoading ? '…' : specs.length}
        </span>
        <div className='flex-1' />
        <Button size='sm' onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className='size-3.5' />
          New Spec
        </Button>
      </header>

      {/* Content: two-panel layout */}
      <div className='flex min-h-0 flex-1 overflow-hidden'>
        {/* Left: Specs list */}
        <div className='flex w-full flex-col overflow-hidden border-r border-border sm:w-[320px] lg:w-[360px]'>
          {/* Search */}
          <div className='shrink-0 border-b border-border px-4 py-2'>
            <div className='flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1.5'>
              <Search className='size-3.5 shrink-0 text-text-tertiary' />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search specs...'
                className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary'
              />
            </div>
          </div>

          {/* Specs list */}
          <div className='flex-1 overflow-y-auto'>
            {isLoading ? (
              <div className='flex flex-col gap-1 p-3'>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className='h-14 w-full rounded-lg' />
                ))}
              </div>
            ) : filteredSpecs.length === 0 ? (
              <div className='flex flex-col items-center gap-2 py-12 text-center'>
                <Layers className='size-8 text-text-quaternary' />
                <p className='text-[13px] text-text-tertiary'>
                  {search ? 'No specs match your search' : 'No specs defined yet'}
                </p>
              </div>
            ) : (
              <div className='flex flex-col gap-0.5 p-2'>
                {filteredSpecs.map((spec) => (
                  <button
                    key={spec.id}
                    type='button'
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition-colors',
                      selectedSpec?.id === spec.id
                        ? 'bg-primary/10 text-foreground'
                        : 'hover:bg-bg-hover text-text-secondary'
                    )}
                    onClick={() => setSelectedSpec(spec)}
                  >
                    <div className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-md text-[11px] font-bold uppercase',
                      spec.display_type === 'swatch' ? 'bg-pink-500/10 text-pink-500'
                        : spec.display_type === 'button' ? 'bg-blue-500/10 text-blue-500'
                        : 'bg-amber-500/10 text-amber-500'
                    )}>
                      {spec.display_type === 'swatch' ? '🎨' : spec.display_type === 'button' ? 'Btn' : '▾'}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <span className='block truncate text-[13px] font-medium'>{spec.name}</span>
                      <span className='text-[11px] text-text-tertiary'>
                        {spec.display_type} · {spec.option_count ?? 0} options
                        {(spec.vp_count ?? 0) > 0 && ` · ${spec.vp_count} supers`}
                      </span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon-xs'
                          className='shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg width='15' height='15' viewBox='0 0 15 15' fill='none'>
                            <circle cx='3' cy='7.5' r='1.2' fill='currentColor' />
                            <circle cx='7.5' cy='7.5' r='1.2' fill='currentColor' />
                            <circle cx='12' cy='7.5' r='1.2' fill='currentColor' />
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-44'>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(spec) }}>
                          <Pencil className='size-3.5' />
                          Edit spec
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMergeSpec(spec); setMergeTargetId('') }}>
                          <Merge className='size-3.5' />
                          Merge into this
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={(e) => { e.stopPropagation(); setDeleteSpec(spec) }}
                        >
                          <Trash2 className='size-3.5' />
                          Delete spec
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Options panel */}
        <div className='hidden flex-1 overflow-hidden sm:flex'>
          {selectedSpec ? (
            <SpecOptionsPanel spec={selectedSpec} projectId={projectId} />
          ) : (
            <div className='flex flex-1 items-center justify-center text-[13px] text-text-tertiary'>
              Select a spec to manage its options
            </div>
          )}
        </div>
      </div>

      {/* ── Create/Edit Spec Dialog ── */}
      <Dialog
        open={createOpen || !!editSpec}
        onOpenChange={(v) => { if (!v) { setCreateOpen(false); setEditSpec(null) } }}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editSpec) updateMutation.mutate()
              else createMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>{editSpec ? 'Edit Spec' : 'New Spec'}</DialogTitle>
              {!editSpec && (
                <p className='text-[12px] text-text-tertiary'>
                  Define an attribute like Color, Size, or Material
                </p>
              )}
            </DialogHeader>
            <DialogBody className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <Label className='text-[12px]'>Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder='e.g. Color, Size, Material' required autoFocus />
              </div>
              <div className='flex flex-col gap-2'>
                <Label className='text-[12px]'>How should customers choose?</Label>
                <div className='grid grid-cols-3 gap-2'>
                  {([
                    { value: 'dropdown' as const, icon: '▾', label: 'Dropdown', desc: 'Select list' },
                    { value: 'swatch' as const, icon: '🎨', label: 'Swatch', desc: 'Color circles' },
                    { value: 'button' as const, icon: '▢', label: 'Button', desc: 'Clickable pills' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type='button'
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 text-center transition-colors',
                        formDisplayType === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border-dark hover:bg-bg-hover'
                      )}
                      onClick={() => setFormDisplayType(opt.value)}
                    >
                      <span className='text-lg'>{opt.icon}</span>
                      <span className='text-[12px] font-medium'>{opt.label}</span>
                      <span className='text-[10px] text-text-tertiary'>{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => { setCreateOpen(false); setEditSpec(null) }}>Cancel</Button>
              <Button type='submit' disabled={!formName.trim()} isPending={editSpec ? updateMutation.isPending : createMutation.isPending}>
                {editSpec ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <Dialog open={!!deleteSpec} onOpenChange={(v) => !v && setDeleteSpec(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete "{deleteSpec?.name}"?</DialogTitle>
            <DialogDescription>
              This will remove the spec and all its options from every superinventory that uses it. This cannot be undone.
              {(deleteSpec?.vp_count ?? 0) > 0 && (
                <span className='mt-1 block font-semibold text-destructive'>
                  ⚠ Used by {deleteSpec?.vp_count} superinventory items
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteSpec(null)}>Cancel</Button>
            <Button variant='destructive' onClick={() => deleteMutation.mutate()} isPending={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Merge Dialog ── */}
      <Dialog open={!!mergeSpec} onOpenChange={(v) => !v && setMergeSpec(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Merge into "{mergeSpec?.name}"</DialogTitle>
            <p className='text-[12px] text-text-tertiary'>
              Pick a spec to absorb. Its options and links move here, then it gets deleted.
            </p>
          </DialogHeader>
          <DialogBody className='max-h-[50vh] overflow-y-auto'>
            <div className='mb-2'>
              <Input
                placeholder='Search specs...'
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-0.5'>
              {specs
                .filter((s) => s.id !== mergeSpec?.id && s.name.toLowerCase().includes(mergeSearch.toLowerCase()))
                .map((s) => (
                  <button
                    key={s.id}
                    type='button'
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors',
                      mergeTargetId === s.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-bg-hover'
                    )}
                    onClick={() => setMergeTargetId(s.id)}
                  >
                    <div className='min-w-0 flex-1'>
                      <span className='block text-[13px] font-medium text-foreground'>{s.name}</span>
                      <span className='text-[11px] text-text-tertiary'>
                        {s.option_count ?? 0} options · {s.vp_count ?? 0} supers · {s.display_type}
                      </span>
                    </div>
                    {mergeTargetId === s.id && (
                      <span className='shrink-0 text-[11px] font-medium text-primary'>Selected</span>
                    )}
                  </button>
                ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant='outline' onClick={() => setMergeSpec(null)}>Cancel</Button>
            <Button
              disabled={!mergeTargetId}
              isPending={mergeMutation.isPending}
              onClick={() => mergeMutation.mutate()}
            >
              <Merge className='size-3.5' />
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/catalog/specs/')({
  component: SpecsManagerPage,
  head: () => ({ meta: [{ title: 'Specs Manager' }] }),
})
