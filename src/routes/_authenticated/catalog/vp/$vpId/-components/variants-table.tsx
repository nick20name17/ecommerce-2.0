import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import type {
  GlobalSpecDefinition,
  SpecOption,
  VariableProduct,
  VariableProductItem,
} from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { VP_QUERY_KEYS, getSpecOptionsQuery } from '@/api/variable-product/query'
import { ProductBrowserDialog } from '@/components/common/product-browser-dialog'
import { ProductThumbnail } from '@/components/common/product-thumbnail'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// ── Props ────────────────────────────────────────────────────

interface VariantsTableProps {
  vp: VariableProduct
  projectId: number | null
  addProductsOpen?: boolean
  onAddProductsChange?: (open: boolean) => void
}

// ── Component ────────────────────────────────────────────────

export const VariantsTable = ({ vp, projectId, addProductsOpen, onAddProductsChange }: VariantsTableProps) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const productBrowserOpen = addProductsOpen ?? false
  const setProductBrowserOpen = onAddProductsChange ?? (() => {})
  const [addManualOpen, setAddManualOpen] = useState(false)
  const [manualAutoid, setManualAutoid] = useState('')
  const [editingCell, setEditingCell] = useState<{ itemId: string; spec: GlobalSpecDefinition } | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState('')

  // Local optimistic state for instant UI updates
  const [localActive, setLocalActive] = useState<Record<string, boolean>>({})
  const getActive = (item: VariableProductItem) => localActive[item.id] ?? item.active ?? true

  // Optimistic spec overrides: key = `${itemId}:${specSlug}`, value = { option_id, value } or null (removed)
  const [localSpecs, setLocalSpecs] = useState<Record<string, { option_id: string; value: string } | null>>({})

  const getSpecValue = (item: VariableProductItem, specSlug: string) => {
    const key = `${item.id}:${specSlug}`
    if (key in localSpecs) return localSpecs[key]
    return item.specs[specSlug] ?? null
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vp.id) })

  // ── Mutations ────────────────────────────────────────────

  const addItemMutation = useMutation({
    mutationFn: (productAutoid: string) =>
      variableProductService.addItem(vp.id, { product_autoid: productAutoid }, params),
    meta: { successMessage: 'Product added', invalidatesQuery: VP_QUERY_KEYS.detail(vp.id) },
  })

  const addBatchMutation = useMutation({
    mutationFn: async (products: { autoid: string }[]) => {
      for (const p of products) {
        await variableProductService.addItem(vp.id, { product_autoid: p.autoid }, params)
      }
    },
    meta: { successMessage: 'Products added', invalidatesQuery: VP_QUERY_KEYS.detail(vp.id) },
  })

  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      variableProductService.removeItem(vp.id, itemId, params),
    meta: { successMessage: 'Product removed', invalidatesQuery: VP_QUERY_KEYS.detail(vp.id) },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (itemId: string) =>
      variableProductService.updateItem(vp.id, itemId, { is_default: true }, params),
    meta: { successMessage: 'Default variant updated', invalidatesQuery: VP_QUERY_KEYS.detail(vp.id) },
  })

  const toggleVisibility = (item: VariableProductItem) => {
    const newActive = !getActive(item)
    setLocalActive((prev) => ({ ...prev, [item.id]: newActive }))
    variableProductService.updateItem(vp.id, item.id, { active: newActive }, params).catch(() =>
      setLocalActive((prev) => ({ ...prev, [item.id]: !newActive }))
    )
  }

  // Fire-and-forget spec mutations with optimistic local state
  const setSpecOptimistic = (itemId: string, specSlug: string, optionId: string, value: string) => {
    setLocalSpecs((prev) => ({ ...prev, [`${itemId}:${specSlug}`]: { option_id: optionId, value } }))
  }
  const removeSpecOptimistic = (itemId: string, specSlug: string) => {
    setLocalSpecs((prev) => ({ ...prev, [`${itemId}:${specSlug}`]: null }))
  }

  const linkMutation = useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      variableProductService.linkItemToOption(vp.id, itemId, { spec_option_id: optionId }, params),
    onSuccess: () => setEditingCell(null),
    onError: () => { setLocalSpecs({}); invalidate() },
  })

  const switchOptionMutation = useMutation({
    mutationFn: async ({ itemId, oldOptionId, newOptionId }: { itemId: string; oldOptionId: string; newOptionId: string }) => {
      await variableProductService.unlinkItemFromOption(vp.id, itemId, oldOptionId, params)
      await variableProductService.linkItemToOption(vp.id, itemId, { spec_option_id: newOptionId }, params)
    },
    onError: () => { setLocalSpecs({}); invalidate() },
  })

  const unlinkMutation = useMutation({
    mutationFn: ({ itemId, optionId }: { itemId: string; optionId: string }) =>
      variableProductService.unlinkItemFromOption(vp.id, itemId, optionId, params),
    onError: () => { setLocalSpecs({}); invalidate() },
  })

  const specs = vp.spec_definitions
  const items = vp.items

  // Fetch ALL options for each spec (not just ones used in this VP)
  const specOptionsQueries = useQueries({
    queries: specs.map((spec) => getSpecOptionsQuery(spec.id, params)),
  })

  // Map spec ID → full options list
  const fullOptionsMap = new Map<string, SpecOption[]>()
  specs.forEach((spec, i) => {
    const raw = specOptionsQueries[i]?.data as unknown
    if (!raw) return
    // Handle both array and paginated { results: [...] } responses
    const arr = Array.isArray(raw) ? raw : (raw as { results?: SpecOption[] })?.results
    if (Array.isArray(arr)) fullOptionsMap.set(spec.id, arr)
  })

  // Get options for a spec — prefers full list, falls back to VP-scoped
  const getOptions = (spec: GlobalSpecDefinition): SpecOption[] =>
    fullOptionsMap.get(spec.id) ?? spec.options ?? []

  // ── Render ───────────────────────────────────────────────

  return (
    <div>

      {items.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border py-8 text-center text-[13px] text-text-tertiary'>
          No products yet. Add products to create variants.
        </div>
      ) : (
        <div className='overflow-auto rounded-lg border border-border'>
          <table className='min-w-full table-fixed text-[13px]'>
            <thead>
              <tr className='border-b border-border bg-bg-secondary text-left text-[12px] font-medium text-text-tertiary'>
                <th className='sticky left-0 z-10 w-auto bg-bg-secondary py-2 pl-3 pr-2'>Product</th>
                <th className='w-[70px] px-3 py-2'>Stock</th>
                {specs.map((spec) => (
                  <th key={spec.id} className='w-[150px] whitespace-nowrap px-3 py-2'>
                    {spec.name}
                    <span className='ml-1 text-[10px] capitalize text-text-quaternary'>
                      ({spec.display_type})
                    </span>
                  </th>
                ))}
                <th className='w-8 px-2 py-2' />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isActive = getActive(item)
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'group border-b border-border-light transition-colors hover:bg-bg-hover',
                      !isActive && 'opacity-50'
                    )}
                  >
                    {/* Product cell */}
                    <td className='sticky left-0 z-10 bg-background py-2 pl-3 pr-2 group-hover:bg-bg-hover'>
                      <div className='flex items-center gap-2.5'>
                        <ProductThumbnail
                          entityType='product'
                          entityId={item.product_autoid}
                          projectId={projectId}
                          className='size-8 shrink-0 rounded-md'
                        />
                        <div className='min-w-0'>
                          <div className='flex items-center gap-1.5'>
                            <span className='truncate font-medium text-foreground'>
                              {item.descr_1 || item.product_id}
                            </span>
                            {item.is_default && (
                              <span className='shrink-0 rounded bg-amber-500/10 px-1 py-0.5 text-[9px] font-bold text-amber-600'>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className='truncate text-[11px] text-text-tertiary'>
                            {item.product_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stock cell */}
                    <td className='px-3 py-2 tabular-nums text-text-secondary'>
                      {item.available_stock ?? '—'}
                    </td>

                    {/* Spec value cells */}
                    {specs.map((spec) => {
                      const val = getSpecValue(item, spec.slug)
                      const allOpts = getOptions(spec)
                      const matchedOption = val
                        ? allOpts.find((o) => o.id === val.option_id)
                        : undefined

                      return (
                        <td key={spec.id} className='px-3 py-2'>
                          <OptionPicker
                            spec={spec}
                            options={allOpts}
                            currentOptionId={val?.option_id ?? null}
                            currentValue={val?.value ?? null}
                            matchedOption={matchedOption}
                            onSelect={(optId) => {
                              const opt = allOpts.find((o) => o.id === optId)
                              if (opt) setSpecOptimistic(item.id, spec.slug, optId, opt.value)
                              if (val) {
                                switchOptionMutation.mutate({ itemId: item.id, oldOptionId: val.option_id, newOptionId: optId })
                              } else {
                                linkMutation.mutate({ itemId: item.id, optionId: optId })
                              }
                            }}
                            onRemove={val ? () => {
                              removeSpecOptimistic(item.id, spec.slug)
                              unlinkMutation.mutate({ itemId: item.id, optionId: val.option_id })
                            } : undefined}
                          />
                        </td>
                      )
                    })}

                    {/* Actions */}
                    <td className='px-2 py-2'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            className='opacity-0 transition-opacity group-hover:opacity-100'
                          >
                            <MoreHorizontal className='size-3.5' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-44'>
                          {!item.is_default && (
                            <DropdownMenuItem onClick={() => setDefaultMutation.mutate(item.id)}>
                              <Star className='size-3.5' />
                              Set as default variant
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toggleVisibility(item)}>
                            {isActive ? <EyeOff className='size-3.5' /> : <Eye className='size-3.5' />}
                            {isActive ? 'Hide from catalog' : 'Show in catalog'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => removeItemMutation.mutate(item.id)}
                          >
                            <Trash2 className='size-3.5' />
                            Remove product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Set Option Dialog ── */}
      <Dialog open={!!editingCell} onOpenChange={(v) => !v && setEditingCell(null)}>
        <DialogContent className='sm:max-w-xs'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (editingCell && selectedOptionId) {
                linkMutation.mutate({ itemId: editingCell.itemId, optionId: selectedOptionId })
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Set {editingCell?.spec.name}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className='flex flex-col gap-1.5'>
                <Label>Option</Label>
                <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder='Choose an option...' />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingCell ? getOptions(editingCell.spec) : []).map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        <div className='flex items-center gap-2'>
                          {editingCell?.spec.display_type === 'swatch' && opt.color_hex && (
                            <div
                              className='size-3 shrink-0 rounded-full border border-border'
                              style={{ backgroundColor: opt.color_hex }}
                            />
                          )}
                          {opt.value}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setEditingCell(null)}>
                Cancel
              </Button>
              <Button type='submit' disabled={!selectedOptionId} isPending={linkMutation.isPending}>
                Set
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Manual Dialog ── */}
      <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
        <DialogContent className='sm:max-w-xs'>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addItemMutation.mutate(manualAutoid, {
                onSuccess: () => { setManualAutoid(''); setAddManualOpen(false) },
              })
            }}
          >
            <DialogHeader>
              <DialogTitle>Add Product by ID</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='manual-autoid'>Product Autoid</Label>
                <Input
                  id='manual-autoid'
                  value={manualAutoid}
                  onChange={(e) => setManualAutoid(e.target.value)}
                  placeholder='INVENTRY_AUTOID'
                  required
                  autoFocus
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setAddManualOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' isPending={addItemMutation.isPending}>
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Product Browser ── */}
      <ProductBrowserDialog
        open={productBrowserOpen}
        onOpenChange={setProductBrowserOpen}
        projectId={projectId}
        title='Add Products to Superinventory'
        onSelect={(products) => addBatchMutation.mutate(products)}
      />
    </div>
  )
}

// ── Option Picker ────────────────────────────────────────────

function OptionPicker({
  spec,
  options,
  currentOptionId,
  currentValue,
  matchedOption,
  onSelect,
  onRemove,
}: {
  spec: GlobalSpecDefinition
  options: SpecOption[]
  currentOptionId: string | null
  currentValue: string | null
  matchedOption?: SpecOption
  onSelect: (optionId: string) => void
  onRemove?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const filtered = deferredSearch
    ? options.filter((o) => o.value.toLowerCase().includes(deferredSearch.toLowerCase()))
    : options

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch('') }}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'inline-flex h-7 max-w-[150px] items-center gap-1.5 rounded-md border px-2 text-[12px] transition-colors',
            currentValue
              ? 'border-border bg-bg-secondary/60 hover:bg-bg-active'
              : 'border-dashed border-border text-text-tertiary hover:border-primary/40 hover:text-primary'
          )}
        >
          {currentValue ? (
            <>
              {spec.display_type === 'swatch' && matchedOption?.color_hex && (
                <div
                  className='size-2.5 shrink-0 rounded-full border border-border/50'
                  style={{ backgroundColor: matchedOption.color_hex }}
                />
              )}
              <span className='truncate text-foreground'>{currentValue}</span>
              <ChevronDown className='size-3 shrink-0 text-text-quaternary' />
            </>
          ) : (
            <>
              <Plus className='size-3 shrink-0' />
              <span>Set</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align='start' sideOffset={4} className='w-[180px] p-0'>
        {/* Search — only show if more than 6 options */}
        {options.length > 6 && (
          <div className='border-b border-border px-2.5 py-1.5'>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search...'
              className='w-full bg-transparent text-[12px] outline-none placeholder:text-text-quaternary'
              autoFocus
            />
          </div>
        )}
        {/* Options list */}
        <div className='max-h-[180px] overflow-y-auto p-1'>
          {filtered.length === 0 ? (
            <div className='px-2 py-2 text-center text-[11px] text-text-tertiary'>No matches</div>
          ) : (
            filtered.map((opt) => {
              const isActive = opt.id === currentOptionId
              return (
                <button
                  key={opt.id}
                  type='button'
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors',
                    isActive ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-bg-hover'
                  )}
                  onClick={() => {
                    if (!isActive) onSelect(opt.id)
                    setOpen(false)
                  }}
                >
                  {spec.display_type === 'swatch' && opt.color_hex && (
                    <div
                      className='size-3 shrink-0 rounded-full border border-border'
                      style={{ backgroundColor: opt.color_hex }}
                    />
                  )}
                  <span className='flex-1 truncate'>{opt.value}</span>
                  {isActive && <Check className='size-3 shrink-0' />}
                </button>
              )
            })
          )}
        </div>
        {/* Remove */}
        {onRemove && (
          <div className='border-t border-border p-1'>
            <button
              type='button'
              className='flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-destructive transition-colors hover:bg-destructive/5'
              onClick={() => { onRemove(); setOpen(false) }}
            >
              <Trash2 className='size-3' />
              Remove
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
