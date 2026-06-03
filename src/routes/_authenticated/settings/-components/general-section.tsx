import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { getProjectByIdQuery } from '@/api/project/query'
import type { Project } from '@/api/project/schema'
import { projectService } from '@/api/project/service'
import { isSuperAdmin } from '@/constants/user'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

export const GeneralSection = ({ projectId }: { projectId: number }) => {
  // Fetch settings via project detail — only for superadmins
  const { user } = useAuth()
  const isSuperAdminUser = !!user?.role && isSuperAdmin(user.role)
  const { data: project } = useQuery({
    ...getProjectByIdQuery(projectId),
    enabled: isSuperAdminUser,
    retry: false
  })

  console.log(project)

  // Remount the form once project data first arrives so the editable fields are
  // seeded from it via lazy initial state — no setState-in-effect / prop mirroring.
  // The key is keyed on projectId (not the project object identity), so background
  // refetches don't remount and clobber in-progress edits; it only reseeds when a
  // different project is loaded. Non-superadmins never load `project`, so the form
  // stays mounted with defaults exactly as before.
  return (
    <GeneralSettingsForm
      key={project ? `loaded-${projectId}` : 'pending'}
      projectId={projectId}
      project={project}
      isSuperAdminUser={isSuperAdminUser}
    />
  )
}

const GeneralSettingsForm = ({
  projectId,
  project,
  isSuperAdminUser
}: {
  projectId: number
  project: Project | undefined
  isSuperAdminUser: boolean
}) => {
  const [unitSystem, setUnitSystem] = useState<string>(project?.unit_system ?? 'metric')
  const [categoryWebFilter, setCategoryWebFilter] = useState(
    project?.category_show_web_filter ?? true
  )
  const [productWebFilter, setProductWebFilter] = useState(project?.product_show_web_filter ?? true)
  const [oosField, setOosField] = useState(project?.oos_field ?? '')
  const [salesTotalField, setSalesTotalField] = useState(project?.sales_total_field ?? '')

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      projectService.update({ id: projectId, payload }),
    onSuccess: () => {
      toast.success('Settings updated')
    },
    meta: { errorMessage: 'Failed to update settings' }
  })

  const save = (payload: Record<string, unknown>) => {
    updateMutation.mutate(payload)
  }

  return (
    <div className='flex-1 overflow-y-auto p-6'>
      <div className='max-w-xl space-y-6'>
        <div>
          <h3 className='text-[14px] font-semibold text-foreground'>General Settings</h3>
          <p className='mt-0.5 text-[13px] text-text-tertiary'>
            Configure project-wide preferences.
          </p>
        </div>

        {/* Unit System */}
        <div>
          <label className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>
            Unit System
          </label>
          <div className='flex gap-2'>
            {(['metric', 'imperial'] as const).map(unit => (
              <button
                key={unit}
                type='button'
                disabled={updateMutation.isPending}
                className={cn(
                  'inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors duration-80',
                  unitSystem === unit
                    ? 'border-primary bg-primary/6 text-primary'
                    : 'border-border text-text-secondary hover:bg-bg-hover'
                )}
                onClick={() => {
                  setUnitSystem(unit)
                  save({ unit_system: unit })
                }}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle switches */}
        <div className='space-y-3'>
          <label className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>
            Web Filters
          </label>

          <div className='flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5'>
            <div>
              <span className='text-[13px] font-medium text-foreground'>Category Web Filter</span>
              <p className='text-[12px] text-text-tertiary'>Show web filter option on categories</p>
            </div>
            <button
              type='button'
              disabled={updateMutation.isPending}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                categoryWebFilter ? 'bg-primary' : 'bg-border'
              )}
              onClick={() => {
                setCategoryWebFilter(!categoryWebFilter)
                save({ category_show_web_filter: !categoryWebFilter })
              }}
            >
              <span
                className={cn(
                  'inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200',
                  categoryWebFilter ? 'translate-x-4.5' : 'translate-x-0.75'
                )}
              />
            </button>
          </div>

          <div className='flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5'>
            <div>
              <span className='text-[13px] font-medium text-foreground'>Product Web Filter</span>
              <p className='text-[12px] text-text-tertiary'>Show web filter option on products</p>
            </div>
            <button
              type='button'
              disabled={updateMutation.isPending}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                productWebFilter ? 'bg-primary' : 'bg-border'
              )}
              onClick={() => {
                setProductWebFilter(!productWebFilter)
                save({ product_show_web_filter: !productWebFilter })
              }}
            >
              <span
                className={cn(
                  'inline-block size-3.5 rounded-full bg-background shadow-sm transition-transform duration-200',
                  productWebFilter ? 'translate-x-4.5' : 'translate-x-0.75'
                )}
              />
            </button>
          </div>
        </div>

        {/* Advanced fields (superadmin only) */}
        {isSuperAdminUser && (
          <div className='space-y-3'>
            <label className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>
              Database Fields
            </label>

            <div className='rounded-xl border border-border px-3.5 py-2.5'>
              <div className='mb-1'>
                <span className='text-[13px] font-medium text-foreground'>Out-of-Stock Field</span>
                <p className='text-[12px] text-text-tertiary'>
                  INVENTRY column used for out-of-stock filtering
                </p>
              </div>
              <input
                value={oosField}
                onChange={e => setOosField(e.target.value)}
                onBlur={() => save({ oos_field: oosField })}
                onKeyDown={e => {
                  if (e.key === 'Enter') save({ oos_field: oosField })
                }}
                placeholder='e.g. QTY_ON_HND'
                disabled={updateMutation.isPending}
                className='placeholder:text-text-quaternary h-8 w-full rounded-md border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary'
              />
            </div>

            <div className='rounded-xl border border-border px-3.5 py-2.5'>
              <div className='mb-1'>
                <span className='text-[13px] font-medium text-foreground'>Sales Total Field</span>
                <p className='text-[12px] text-text-tertiary'>
                  ARINV column for monetary totals (e.g. total, sub_total)
                </p>
              </div>
              <input
                value={salesTotalField}
                onChange={e => setSalesTotalField(e.target.value)}
                onBlur={() => save({ sales_total_field: salesTotalField })}
                onKeyDown={e => {
                  if (e.key === 'Enter') save({ sales_total_field: salesTotalField })
                }}
                placeholder='e.g. total'
                disabled={updateMutation.isPending}
                className='placeholder:text-text-quaternary h-8 w-full rounded-md border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
