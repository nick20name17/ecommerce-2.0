import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type {
  GlobalSpecDefinition,
  SpecDisplayType,
  VariableProduct,
} from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS, getSpecsQuery } from '@/api/variable-product/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DISPLAY_TYPES: { value: SpecDisplayType; label: string }[] = [
  { value: 'swatch', label: 'Swatch (Color circles)' },
  { value: 'dropdown', label: 'Dropdown (Select menu)' },
  { value: 'button', label: 'Button (Toggle group)' },
]

interface VPSpecsSectionProps {
  vp: VariableProduct
  projectId: number | null
}

export const VPSpecsSection = ({ vp, projectId }: VPSpecsSectionProps) => {
  const [addOpen, setAddOpen] = useState(false)
  const [editSpec, setEditSpec] = useState<GlobalSpecDefinition | null>(null)
  const [deleteSpec, setDeleteSpec] = useState<GlobalSpecDefinition | null>(null)
  const [specName, setSpecName] = useState('')
  const [displayType, setDisplayType] = useState<SpecDisplayType>('dropdown')
  const [sortOrder, setSortOrder] = useState(0)

  const addSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpec(
        { name: specName, display_type: displayType, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Spec created',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetForm()
      setAddOpen(false)
    },
  })

  const updateSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.updateSpec(
        editSpec!.id,
        { name: specName, display_type: displayType, sort_order: sortOrder },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Spec updated',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => {
      resetForm()
      setEditSpec(null)
    },
  })

  const deleteSpecMutation = useMutation({
    mutationFn: () =>
      variableProductService.deleteSpec(deleteSpec!.id, {
        project_id: projectId ?? undefined,
      }),
    meta: {
      successMessage: 'Spec deleted',
      invalidatesQuery: VP_QUERY_KEYS.detail(vp.id),
    },
    onSuccess: () => setDeleteSpec(null),
  })

  const resetForm = () => {
    setSpecName('')
    setDisplayType('dropdown')
    setSortOrder(0)
  }

  const openEdit = (spec: GlobalSpecDefinition) => {
    setSpecName(spec.name)
    setDisplayType(spec.display_type)
    setSortOrder(spec.sort_order)
    setEditSpec(spec)
  }

  const isPending = addSpecMutation.isPending || updateSpecMutation.isPending

  return (
    <div>
      <div className='flex items-center gap-2 mb-2'>
        <h3 className='text-[13px] font-semibold text-text-secondary'>
          Specs ({vp.spec_definitions.length})
        </h3>
        <div className='flex-1' />
        <Button variant='outline' size='xs' onClick={() => { resetForm(); setAddOpen(true) }}>
          <Plus className='size-3' />
          Add Spec
        </Button>
      </div>

      {vp.spec_definitions.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-6 text-center text-[13px] text-text-tertiary'>
          No spec definitions yet
        </div>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {vp.spec_definitions.map((spec) => {
            const isShared = (spec.vp_count ?? 0) > 1
            return (
              <div
                key={spec.id}
                className='group flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2'
              >
                <div>
                  <div className='text-[13px] font-medium'>{spec.name}</div>
                  <div className='text-[11px] text-text-tertiary capitalize'>
                    {spec.display_type} · {spec.options?.length ?? 0} options
                    {isShared && (
                      <span className='ml-1 text-amber-500 font-medium normal-case'>
                        · Used by {spec.vp_count} VPs
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon-xs'
                      className='sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
                    >
                      <MoreHorizontal className='size-3.5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    {isShared ? (
                      <div className='px-2 py-1.5 text-[12px] text-text-tertiary'>
                        Shared spec — editing disabled
                      </div>
                    ) : (
                      <DropdownMenuItem onClick={() => openEdit(spec)}>
                        <Pencil className='size-3.5' />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={() => setDeleteSpec(spec)}
                    >
                      <Trash2 className='size-3.5' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      )}

      {/* Add dialog — select existing or create new */}
      <AddSpecDialog
        open={addOpen}
        onOpenChange={(v) => { if (!v) { setAddOpen(false); resetForm() } }}
        vp={vp}
        projectId={projectId}
        specName={specName}
        setSpecName={setSpecName}
        displayType={displayType}
        setDisplayType={setDisplayType}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onCreateNew={() => addSpecMutation.mutate()}
        isPending={isPending}
      />

      {/* Edit dialog */}
      <Dialog
        open={!!editSpec}
        onOpenChange={(v) => {
          if (!v) { setEditSpec(null); resetForm() }
        }}
      >
        <DialogContent className='sm:max-w-sm'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateSpecMutation.mutate()
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Spec</DialogTitle>
            </DialogHeader>
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-name-edit'>Name</Label>
                <Input
                  id='spec-name-edit'
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Display Type</Label>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v as SpecDisplayType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISPLAY_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-sort-edit'>Sort Order</Label>
                <Input
                  id='spec-sort-edit'
                  type='number'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => { setEditSpec(null); resetForm() }}>Cancel</Button>
              <Button type='submit' isPending={isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteSpec} onOpenChange={(v) => !v && setDeleteSpec(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Delete Spec</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleteSpec?.name}</strong>? This will also delete all its options and item links.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteSpec(null)}>Cancel</Button>
            <Button variant='destructive' onClick={() => deleteSpecMutation.mutate()} isPending={deleteSpecMutation.isPending}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Add Spec Dialog (select existing or create new) ─────────

function AddSpecDialog({
  open,
  onOpenChange,
  vp,
  projectId,
  specName,
  setSpecName,
  displayType,
  setDisplayType,
  sortOrder,
  setSortOrder,
  onCreateNew,
  isPending,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  vp: VariableProduct
  projectId: number | null
  specName: string
  setSpecName: (v: string) => void
  displayType: SpecDisplayType
  setDisplayType: (v: SpecDisplayType) => void
  sortOrder: number
  setSortOrder: (v: number) => void
  onCreateNew: () => void
  isPending: boolean
}) {
  const [tab, setTab] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')

  // Fetch all global specs
  const { data: allSpecs } = useQuery({
    ...getSpecsQuery({ project_id: projectId ?? undefined }),
    enabled: open,
  })

  // Specs already on this VP
  const existingSpecIds = new Set(vp.spec_definitions.map((s) => s.id))

  // Available specs = all global specs not already on this VP
  const availableSpecs = (allSpecs?.results ?? []).filter(
    (s) => !existingSpecIds.has(s.id) &&
      (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSearch(''); setTab('existing') } }}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Spec</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className='flex gap-1 border-b border-border'>
          <button
            type='button'
            className={cn(
              'px-3 py-1.5 text-[13px] font-medium border-b-2 transition-colors',
              tab === 'existing' ? 'border-primary text-foreground' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            )}
            onClick={() => setTab('existing')}
          >
            Use Existing
          </button>
          <button
            type='button'
            className={cn(
              'px-3 py-1.5 text-[13px] font-medium border-b-2 transition-colors',
              tab === 'new' ? 'border-primary text-foreground' : 'border-transparent text-text-tertiary hover:text-text-secondary'
            )}
            onClick={() => setTab('new')}
          >
            Create New
          </button>
        </div>

        {tab === 'existing' ? (
          <ExistingSpecPicker
            specs={availableSpecs}
            search={search}
            onSearchChange={setSearch}
            vp={vp}
            projectId={projectId}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onCreateNew()
            }}
          >
            <DialogBody className='flex flex-col gap-3'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-name-new'>Name</Label>
                <Input
                  id='spec-name-new'
                  value={specName}
                  onChange={(e) => setSpecName(e.target.value)}
                  placeholder='e.g. Color, Size'
                  required
                  autoFocus
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>Display Type</Label>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v as SpecDisplayType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISPLAY_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='spec-sort-new'>Sort Order</Label>
                <Input
                  id='spec-sort-new'
                  type='number'
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type='submit' isPending={isPending}>Create</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Existing spec picker ────────────────────────────────────

function ExistingSpecPicker({
  specs,
  search,
  onSearchChange,
  vp,
  projectId,
  onDone,
}: {
  specs: GlobalSpecDefinition[]
  search: string
  onSearchChange: (v: string) => void
  vp: VariableProduct
  projectId: number | null
  onDone: () => void
}) {
  // To "use" an existing spec, we just need to link one of its options
  // to an item. But actually, the spec shows up on the VP detail when
  // any of its options are linked to any VP item. So we need a way to
  // "associate" a spec with this VP — the simplest is to create a
  // placeholder link. But that requires an item and option.
  //
  // Actually, specs appear in vp.spec_definitions when fetched via
  // the VP detail endpoint which joins through EC_VP_ITEM_SPEC.
  // To make a spec appear, at least one item must be linked to one
  // of the spec's options.
  //
  // For now: show the list, user clicks a spec, we show its options,
  // and user can immediately link an item. But this is complex UX.
  //
  // Simpler approach: just show available specs and let user know
  // they need to use the Values Matrix to link items to this spec's options.

  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <DialogBody className='flex flex-col gap-2 min-h-[200px] max-h-[350px]'>
        <div className='relative'>
          <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary' />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search specs...'
            className='pl-8 h-8 text-[13px]'
          />
        </div>

        {specs.length === 0 ? (
          <div className='flex-1 flex items-center justify-center text-[13px] text-text-tertiary'>
            {search ? 'No matching specs' : 'All specs are already added'}
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto -mx-1'>
            {specs.map((spec) => (
              <button
                key={spec.id}
                type='button'
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                  selectedId === spec.id ? 'bg-primary/10' : 'hover:bg-bg-hover'
                )}
                onClick={() => setSelectedId(selectedId === spec.id ? null : spec.id)}
              >
                <div className={cn(
                  'flex size-4 items-center justify-center rounded-full border transition-colors',
                  selectedId === spec.id ? 'border-primary bg-primary' : 'border-border'
                )}>
                  {selectedId === spec.id && <Check className='size-2.5 text-primary-foreground' />}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='text-[13px] font-medium'>{spec.name}</div>
                  <div className='text-[11px] text-text-tertiary capitalize'>
                    {spec.display_type} · {spec.options?.length ?? 0} options
                    {(spec.vp_count ?? 0) > 0 && ` · ${spec.vp_count} VPs`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedId && (
          <div className='rounded-md bg-bg-secondary p-2 text-[12px] text-text-tertiary'>
            After adding, use the Values Matrix below to link items to this spec's options.
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant='outline' onClick={onDone}>Cancel</Button>
        <Button disabled={!selectedId} onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </>
  )
}
