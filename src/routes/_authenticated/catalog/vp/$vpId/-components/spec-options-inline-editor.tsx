import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { getSpecOptionsQuery, VP_QUERY_KEYS } from '@/api/variable-product/query'
import type { SpecDisplayType, SpecOption } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  specId: string
  displayType: SpecDisplayType
  projectId: number | null
  vpId: string
}

export const SpecOptionsInlineEditor = ({
  specId,
  displayType,
  projectId,
  vpId,
}: Props) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const { data: rawData, isLoading } = useQuery(getSpecOptionsQuery(specId, params))
  const options: SpecOption[] = Array.isArray(rawData)
    ? rawData
    : ((rawData as unknown as { results?: SpecOption[] })?.results ?? [])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specOptions(specId) })
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vpId) })
  }

  const [newValue, setNewValue] = useState('')
  const createMutation = useMutation({
    mutationFn: () =>
      variableProductService.createSpecOption(
        specId,
        { value: newValue.trim(), sort_order: options.length },
        params
      ),
    meta: { successMessage: 'Option added' },
    onSuccess: () => {
      invalidate()
      setNewValue('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (optionId: string) =>
      variableProductService.deleteSpecOption(specId, optionId, params),
    meta: { successMessage: 'Option deleted' },
    onSuccess: invalidate,
  })

  return (
    <div className='flex flex-col gap-2'>
      <Label className='text-[12px]'>
        Options
        {displayType === 'swatch' && (
          <span className='ml-1 text-[11px] font-normal text-text-tertiary'>
            · click swatch to set color
          </span>
        )}
      </Label>

      <div className='rounded-lg border border-border'>
        {isLoading ? (
          <div className='flex flex-col gap-1 p-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full rounded-md' />
            ))}
          </div>
        ) : options.length === 0 ? (
          <div className='px-3 py-4 text-center text-[12px] text-text-tertiary'>
            No options yet. Add one below.
          </div>
        ) : (
          <div className='flex flex-col divide-y divide-border-light'>
            {options.map((opt) => (
              <OptionRow
                key={opt.id}
                specId={specId}
                option={opt}
                displayType={displayType}
                projectId={projectId}
                vpId={vpId}
                onDelete={() => deleteMutation.mutate(opt.id)}
                isDeleting={
                  deleteMutation.isPending && deleteMutation.variables === opt.id
                }
              />
            ))}
          </div>
        )}

        {/* Add row */}
        <form
          className='flex items-center gap-2 border-t border-border-light px-2 py-1.5'
          onSubmit={(e) => {
            e.preventDefault()
            if (newValue.trim()) createMutation.mutate()
          }}
        >
          <Plus className='size-3.5 shrink-0 text-text-tertiary' />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder='Add option (e.g. Red, Large)'
            className='h-7 border-0 bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0'
          />
          <Button
            type='submit'
            size='sm'
            variant='ghost'
            disabled={!newValue.trim() || createMutation.isPending}
            isPending={createMutation.isPending}
          >
            Add
          </Button>
        </form>
      </div>
    </div>
  )
}

interface OptionRowProps {
  specId: string
  option: SpecOption
  displayType: SpecDisplayType
  projectId: number | null
  vpId: string
  onDelete: () => void
  isDeleting: boolean
}

const OptionRow = ({
  specId,
  option,
  displayType,
  projectId,
  vpId,
  onDelete,
  isDeleting,
}: OptionRowProps) => {
  const queryClient = useQueryClient()
  const params = { project_id: projectId ?? undefined }

  const [value, setValue] = useState(option.value)
  const [color, setColor] = useState(option.color_hex || '')
  const [sort, setSort] = useState(option.sort_order)

  // Sync from upstream changes (e.g. refetch after another mutation)
  useEffect(() => {
    setValue(option.value)
    setColor(option.color_hex || '')
    setSort(option.sort_order)
  }, [option.id, option.value, option.color_hex, option.sort_order])

  const patch = async (payload: Partial<SpecOption>) => {
    await variableProductService.updateSpecOption(specId, option.id, payload, params)
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.specOptions(specId) })
    queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.detail(vpId) })
  }

  const debouncedPatchColor = useDebouncedCallback((next: string) => {
    if (next !== (option.color_hex || '')) patch({ color_hex: next })
  }, 400)

  return (
    <div className='flex items-center gap-2 px-2 py-1.5'>
      {displayType === 'swatch' ? (
        <ColorPicker
          value={color}
          onChange={(next) => {
            setColor(next)
            debouncedPatchColor(next)
          }}
          size='icon-sm'
          className='size-7 rounded-full border-border'
        />
      ) : (
        <div className='size-7 shrink-0 rounded-md bg-bg-secondary text-center text-[11px] leading-7 text-text-tertiary'>
          {value.slice(0, 2).toUpperCase()}
        </div>
      )}

      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value.trim() && value !== option.value) patch({ value: value.trim() })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className='h-7 flex-1 border-0 bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0'
        placeholder='Value'
      />

      {displayType === 'swatch' && color && (
        <span className='font-mono text-[10px] uppercase text-text-quaternary'>
          {color}
        </span>
      )}

      <input
        type='number'
        value={sort}
        onChange={(e) => setSort(Number(e.target.value))}
        onBlur={() => {
          if (sort !== option.sort_order) patch({ sort_order: sort })
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className='w-10 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-[11px] tabular-nums text-text-quaternary outline-none transition-colors hover:border-border focus:border-primary focus:text-foreground'
        title='Sort order'
      />

      <Button
        type='button'
        variant='ghost'
        size='icon-xs'
        className='hover:text-destructive'
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className='size-3' />
      </Button>
    </div>
  )
}