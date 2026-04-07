import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getProjectByIdQuery } from '@/api/project/query'
import { projectService } from '@/api/project/service'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'
import { isSuperAdmin } from '@/constants/user'

export const GeneralSection = ({ projectId }: { projectId: number }) => {
  const [unitSystem, setUnitSystem] = useState<string>('metric')
  const [categoryWebFilter, setCategoryWebFilter] = useState(true)
  const [productWebFilter, setProductWebFilter] = useState(true)
  const [loaded, setLoaded] = useState(false)

  // Fetch settings via project detail — only for superadmins
  const { user } = useAuth()
  const isSuperAdminUser = !!user?.role && isSuperAdmin(user.role)
  const { data: project } = useQuery({
    ...getProjectByIdQuery(projectId),
    enabled: isSuperAdminUser,
    retry: false,
  })

  useEffect(() => {
    if (project && !loaded) {
      setUnitSystem(project.unit_system ?? 'metric')
      setCategoryWebFilter(project.category_show_web_filter ?? true)
      setProductWebFilter(project.product_show_web_filter ?? true)
      setLoaded(true)
    }
  }, [project, loaded])

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      projectService.update({ id: projectId, payload }),
    onSuccess: () => {
      toast.success('Settings updated')
    },
    meta: { errorMessage: 'Failed to update settings' },
  })

  const save = (payload: Record<string, unknown>) => {
    updateMutation.mutate(payload)
  }

  return (
    <div className='flex-1 overflow-y-auto p-6'>
      <div className='max-w-xl space-y-6'>
        <div>
          <h3 className='text-[14px] font-semibold text-foreground'>General Settings</h3>
          <p className='mt-0.5 text-[13px] text-text-tertiary'>Configure project-wide preferences.</p>
        </div>

        {/* Unit System */}
        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>Unit System</label>
          <div className='flex gap-2'>
            {(['metric', 'imperial'] as const).map((unit) => (
              <button
                key={unit}
                type='button'
                disabled={updateMutation.isPending}
                className={cn(
                  'inline-flex h-8 items-center rounded-[6px] border px-3 text-[13px] font-medium transition-colors duration-[80ms]',
                  unitSystem === unit
                    ? 'border-primary bg-primary/[0.06] text-primary'
                    : 'border-border text-text-secondary hover:bg-bg-hover',
                )}
                onClick={() => { setUnitSystem(unit); save({ unit_system: unit }) }}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>
        </div>


        {/* Toggle switches */}
        <div className='space-y-3'>
          <label className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>Web Filters</label>

          <div className='flex items-center justify-between rounded-[8px] border border-border px-3.5 py-2.5'>
            <div>
              <span className='text-[13px] font-medium text-foreground'>Category Web Filter</span>
              <p className='text-[12px] text-text-tertiary'>Show web filter option on categories</p>
            </div>
            <button
              type='button'
              disabled={updateMutation.isPending}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                categoryWebFilter ? 'bg-primary' : 'bg-border',
              )}
              onClick={() => { setCategoryWebFilter(!categoryWebFilter); save({ category_show_web_filter: !categoryWebFilter }) }}
            >
              <span className={cn('inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200', categoryWebFilter ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
            </button>
          </div>

          <div className='flex items-center justify-between rounded-[8px] border border-border px-3.5 py-2.5'>
            <div>
              <span className='text-[13px] font-medium text-foreground'>Product Web Filter</span>
              <p className='text-[12px] text-text-tertiary'>Show web filter option on products</p>
            </div>
            <button
              type='button'
              disabled={updateMutation.isPending}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                productWebFilter ? 'bg-primary' : 'bg-border',
              )}
              onClick={() => { setProductWebFilter(!productWebFilter); save({ product_show_web_filter: !productWebFilter }) }}
            >
              <span className={cn('inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200', productWebFilter ? 'translate-x-[18px]' : 'translate-x-[3px]')} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
