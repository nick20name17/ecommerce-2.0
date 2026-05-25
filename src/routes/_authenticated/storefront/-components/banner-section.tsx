import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  STOREFRONT_CONFIG_QUERY_KEYS,
  getStorefrontConfigQuery
} from '@/api/storefront-config/query'
import {
  type StorefrontBanner,
  type StorefrontConfig,
  defaultStorefrontConfig
} from '@/api/storefront-config/schema'
import { storefrontConfigService } from '@/api/storefront-config/service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ColorPicker } from '@/components/ui/color-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

const DEFAULT_BANNER: StorefrontBanner = defaultStorefrontConfig().components.banner

const toNumberOrNull = (value: string): number | null => {
  if (value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

interface BannerSectionProps {
  projectId: number
}

export const BannerSection = ({ projectId }: BannerSectionProps) => {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(getStorefrontConfigQuery(projectId))

  const [banner, setBanner] = useState<StorefrontBanner>(DEFAULT_BANNER)

  // Sync local form state when fresh data lands.
  useEffect(() => {
    if (data) setBanner({ ...DEFAULT_BANNER, ...data.components.banner })
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (next: StorefrontConfig) =>
      storefrontConfigService.update(projectId, next),
    onSuccess: () => {
      toast.success('Banner saved')
      queryClient.invalidateQueries({
        queryKey: STOREFRONT_CONFIG_QUERY_KEYS.byProject(projectId)
      })
    },
    meta: { errorMessage: 'Failed to save banner' }
  })

  const handleSave = () => {
    const merged: StorefrontConfig = {
      ...(data ?? defaultStorefrontConfig()),
      components: {
        ...(data?.components ?? defaultStorefrontConfig().components),
        banner
      }
    }
    updateMutation.mutate(merged)
  }

  const update = <K extends keyof StorefrontBanner>(
    key: K,
    value: StorefrontBanner[K]
  ) => setBanner((prev) => ({ ...prev, [key]: value }))

  return (
    <TooltipProvider>
      <div className='flex-1 overflow-y-auto p-6'>
        <div className='max-w-xl space-y-6'>
          <div>
            <h3 className='text-[14px] font-semibold text-foreground'>Banner</h3>
            <p className='mt-0.5 text-[13px] text-text-tertiary'>
              * this component may not be displayed on your website because it is
              not provided by the design
            </p>
          </div>

          {/* Authorized users only */}
          <div className='flex items-start gap-3'>
            <Checkbox
              id='banner-authorized-only'
              checked={banner.authorizedOnly}
              onCheckedChange={(v) => update('authorizedOnly', v === true)}
              disabled={isLoading}
            />
            <div className='space-y-1 leading-none'>
              <Label
                htmlFor='banner-authorized-only'
                className='text-[13px] font-medium'
              >
                Authorized users only
              </Label>
              <p className='text-[12px] text-text-tertiary'>
                If checked, the banner will only be displayed for authorized users.
              </p>
            </div>
          </div>

          {/* Message */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='banner-text'
              className='flex items-center gap-1 text-[12px] font-medium text-text-tertiary'
            >
              Message
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='size-3.5 cursor-pointer text-text-tertiary' />
                </TooltipTrigger>
                <TooltipContent>
                  If the text is empty, the banner won't be displayed.
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id='banner-text'
              placeholder='Banner text'
              value={banner.text}
              onChange={(e) => update('text', e.currentTarget.value)}
              disabled={isLoading}
            />
          </div>

          {/* Font size */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='banner-font-size'
              className='text-[12px] font-medium text-text-tertiary'
            >
              Font size
            </Label>
            <Input
              id='banner-font-size'
              type='number'
              placeholder='px'
              value={banner.fontSize ?? ''}
              onChange={(e) => update('fontSize', toNumberOrNull(e.currentTarget.value))}
              disabled={isLoading}
            />
          </div>

          {/* Height */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='banner-height'
              className='text-[12px] font-medium text-text-tertiary'
            >
              Height
            </Label>
            <Input
              id='banner-height'
              type='number'
              placeholder='px'
              value={banner.height ?? ''}
              onChange={(e) => update('height', toNumberOrNull(e.currentTarget.value))}
              disabled={isLoading}
            />
          </div>

          {/* Text color */}
          <div className='space-y-1.5'>
            <Label className='text-[12px] font-medium text-text-tertiary'>
              Text color
            </Label>
            <div className='flex items-center gap-3'>
              <ColorPicker
                value={banner.color ?? '#FFFFFF'}
                onChange={(v) => update('color', v)}
                disabled={isLoading}
              />
              <span className='font-mono text-[13px] text-text-secondary'>
                {banner.color ?? '#FFFFFF'}
              </span>
            </div>
          </div>

          {/* Background color */}
          <div className='space-y-1.5'>
            <Label className='text-[12px] font-medium text-text-tertiary'>
              Background color
            </Label>
            <div className='flex items-center gap-3'>
              <ColorPicker
                value={banner.background ?? '#000000'}
                onChange={(v) => update('background', v)}
                disabled={isLoading}
              />
              <span className='font-mono text-[13px] text-text-secondary'>
                {banner.background ?? '#000000'}
              </span>
            </div>
          </div>

          {/* Save */}
          <div className='pt-2'>
            <Button
              type='button'
              onClick={handleSave}
              disabled={isLoading || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className='mr-2 size-4 animate-spin' />
              )}
              {updateMutation.isPending ? 'Saving' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}