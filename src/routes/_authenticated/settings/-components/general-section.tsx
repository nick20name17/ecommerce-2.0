import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { PROJECT_QUERY_KEYS, getProjectByIdQuery } from '@/api/project/query'
import type { Project, ProjectSettingsPayload } from '@/api/project/schema'
import { projectService } from '@/api/project/service'
import { isAdmin, isSuperAdmin } from '@/constants/user'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

export const GeneralSection = ({ projectId }: { projectId: number }) => {
  const { user } = useAuth()
  // Load for all admins so the toggles seed from real values, not defaults.
  const isAdminUser = !!user?.role && isAdmin(user.role)
  const isSuperAdminUser = !!user?.role && isSuperAdmin(user.role)
  const { data: project } = useQuery({
    ...getProjectByIdQuery(projectId),
    enabled: isAdminUser,
    retry: false
  })

  // Key on projectId so the form seeds once via lazy initial state and refetches don't clobber edits.
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
  const queryClient = useQueryClient()

  const [unitSystem, setUnitSystem] = useState<string>(project?.unit_system ?? 'metric')
  const [categoryWebFilter, setCategoryWebFilter] = useState(
    project?.category_show_web_filter ?? true
  )
  const [productWebFilter, setProductWebFilter] = useState(project?.product_show_web_filter ?? true)
  const [oosField, setOosField] = useState(project?.oos_field ?? '')
  const [salesTotalField, setSalesTotalField] = useState(project?.sales_total_field ?? '')

  const oosSavedRef = useRef(oosField)
  const salesSavedRef = useRef(salesTotalField)

  const isReady = !!project

  const updateMutation = useMutation({
    mutationFn: ({ payload }: { payload: ProjectSettingsPayload; rollback: () => void }) =>
      projectService.update({ id: projectId, payload }),
    onSuccess: () => {
      toast.success('Settings updated')
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) })
    },
    onError: (_error, variables) => {
      variables.rollback()
    },
    meta: { errorMessage: 'Failed to update settings' }
  })

  const save = (payload: ProjectSettingsPayload, rollback: () => void) => {
    updateMutation.mutate({ payload, rollback })
  }

  const commitOosField = () => {
    if (oosField === oosSavedRef.current) return
    const prevSaved = oosSavedRef.current
    oosSavedRef.current = oosField
    save({ oos_field: oosField }, () => {
      oosSavedRef.current = prevSaved
    })
  }

  const commitSalesTotalField = () => {
    if (salesTotalField === salesSavedRef.current) return
    const prevSaved = salesSavedRef.current
    salesSavedRef.current = salesTotalField
    save({ sales_total_field: salesTotalField }, () => {
      salesSavedRef.current = prevSaved
    })
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

        <div>
          <div className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>Unit System</div>
          <div className='flex gap-2'>
            {(['metric', 'imperial'] as const).map(unit => (
              <button
                key={unit}
                type='button'
                disabled={!isReady}
                aria-pressed={unitSystem === unit}
                className={cn(
                  'inline-flex h-8 items-center rounded-md border px-3 text-[13px] font-medium transition-colors duration-80 disabled:cursor-not-allowed disabled:opacity-50',
                  unitSystem === unit
                    ? 'border-primary bg-primary/6 text-primary'
                    : 'border-border text-text-secondary hover:bg-bg-hover'
                )}
                onClick={() => {
                  if (unit === unitSystem) return
                  const prev = unitSystem
                  setUnitSystem(unit)
                  save({ unit_system: unit }, () => setUnitSystem(prev))
                }}
              >
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-3'>
          <div className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>Web Filters</div>

          <div className='flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5'>
            <div>
              <span className='text-[13px] font-medium text-foreground'>Category Web Filter</span>
              <p className='text-[12px] text-text-tertiary'>Show web filter option on categories</p>
            </div>
            <button
              type='button'
              role='switch'
              aria-checked={categoryWebFilter}
              aria-label='Category Web Filter'
              disabled={!isReady}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                categoryWebFilter ? 'bg-primary' : 'bg-border'
              )}
              onClick={() => {
                const prev = categoryWebFilter
                const next = !prev
                setCategoryWebFilter(next)
                save({ category_show_web_filter: next }, () => setCategoryWebFilter(prev))
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
              role='switch'
              aria-checked={productWebFilter}
              aria-label='Product Web Filter'
              disabled={!isReady}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                productWebFilter ? 'bg-primary' : 'bg-border'
              )}
              onClick={() => {
                const prev = productWebFilter
                const next = !prev
                setProductWebFilter(next)
                save({ product_show_web_filter: next }, () => setProductWebFilter(prev))
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
            <div className='mb-1.5 block text-[12px] font-medium text-text-tertiary'>
              Database Fields
            </div>

            <div className='rounded-lg border border-border px-3.5 py-2.5'>
              <div className='mb-1'>
                <label htmlFor='oos-field' className='text-[13px] font-medium text-foreground'>
                  Out-of-Stock Field
                </label>
                <p className='text-[12px] text-text-tertiary'>
                  INVENTRY column used for out-of-stock filtering
                </p>
              </div>
              <input
                id='oos-field'
                value={oosField}
                onChange={e => setOosField(e.target.value)}
                onBlur={commitOosField}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                placeholder='e.g. QTY_ON_HND'
                disabled={!isReady}
                className='placeholder:text-text-quaternary h-8 w-full rounded-md border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50'
              />
            </div>

            <div className='rounded-lg border border-border px-3.5 py-2.5'>
              <div className='mb-1'>
                <label
                  htmlFor='sales-total-field'
                  className='text-[13px] font-medium text-foreground'
                >
                  Sales Total Field
                </label>
                <p className='text-[12px] text-text-tertiary'>
                  ARINV column for monetary totals (e.g. total, sub_total)
                </p>
              </div>
              <input
                id='sales-total-field'
                value={salesTotalField}
                onChange={e => setSalesTotalField(e.target.value)}
                onBlur={commitSalesTotalField}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                placeholder='e.g. total'
                disabled={!isReady}
                className='placeholder:text-text-quaternary h-8 w-full rounded-md border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
