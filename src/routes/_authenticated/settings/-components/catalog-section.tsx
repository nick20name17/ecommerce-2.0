import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  Database,
  Download,
  FolderTree,
  ImageIcon,
  Layers,
  Package,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import type { ImportStatusResponse } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { projectService } from '@/api/project/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { catalogImageService } from '@/api/catalog-image/service'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ImportPollState {
  taskId: string
  status: ImportStatusResponse['status']
  progress?: string
  result?: Record<string, unknown>
  error?: string
}

interface CatalogSectionProps {
  projectId: number
}

function lsKey(type: string, projectId: number) {
  return `import_task_${type}_${projectId}`
}

function saveTask(type: string, projectId: number, taskId: string) {
  localStorage.setItem(lsKey(type, projectId), taskId)
}

function clearTask(type: string, projectId: number) {
  localStorage.removeItem(lsKey(type, projectId))
}

function getSavedTask(type: string, projectId: number): string | null {
  return localStorage.getItem(lsKey(type, projectId))
}

export const CatalogSection = ({ projectId }: CatalogSectionProps) => {
  const [swatchSpecNames, setSwatchSpecNames] = useState('')
  const [singleSuperId, setSingleSuperId] = useState('')
  const [singleSwatchNames, setSingleSwatchNames] = useState('')
  const [importStatus, setImportStatus] = useState<ImportPollState | null>(null)
  const [vpImportStatus, setVPImportStatus] = useState<ImportPollState | null>(null)
  const [singleVPResult, setSingleVPResult] = useState<Record<string, unknown> | null>(null)
  const [imgImportStatus, setImgImportStatus] = useState<ImportPollState | null>(null)
  const [fullImportStatus, setFullImportStatus] = useState<ImportPollState | null>(null)
  const importIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const vpImportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const imgImportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fullImportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const queryClient = useQueryClient()

  const clearImportPolling = useCallback(() => {
    if (importIntervalRef.current) {
      clearInterval(importIntervalRef.current)
      importIntervalRef.current = null
    }
  }, [])

  const clearVPImportPolling = useCallback(() => {
    if (vpImportIntervalRef.current) {
      clearInterval(vpImportIntervalRef.current)
      vpImportIntervalRef.current = null
    }
  }, [])

  const clearImgImportPolling = useCallback(() => {
    if (imgImportIntervalRef.current) {
      clearInterval(imgImportIntervalRef.current)
      imgImportIntervalRef.current = null
    }
  }, [])

  const clearFullImportPolling = useCallback(() => {
    if (fullImportIntervalRef.current) {
      clearInterval(fullImportIntervalRef.current)
      fullImportIntervalRef.current = null
    }
  }, [])

  // Poll the full-import task. The backend reports stage transitions and
  // detailed progress through the same task_id; on completion we invalidate
  // both catalog and VP query caches since the pipeline writes both.
  const startFullImportPolling = useCallback(
    (taskId: string) => {
      clearFullImportPolling()
      setFullImportStatus({ taskId, status: 'running' })
      saveTask('full', projectId, taskId)

      fullImportIntervalRef.current = setInterval(async () => {
        try {
          const status = await catalogService.getImportStatus(taskId, {
            project_id: projectId,
          })
          setFullImportStatus({
            taskId,
            status: status.status,
            progress: status.progress,
            result: status.result,
            error: status.error,
          })
          if (status.status === 'completed' || status.status === 'failed') {
            clearFullImportPolling()
            clearTask('full', projectId)
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.all() })
              queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
            }
          }
        } catch {
          clearFullImportPolling()
          clearTask('full', projectId)
          setFullImportStatus((prev) =>
            prev ? { ...prev, status: 'failed', error: 'Failed to check import status' } : null
          )
        }
      }, 2000)
    },
    [clearFullImportPolling, projectId, queryClient]
  )

  // Start polling for category import
  const startCategoryPolling = useCallback(
    (taskId: string) => {
      clearImportPolling()
      setImportStatus({ taskId, status: 'running' })
      saveTask('cat', projectId, taskId)

      importIntervalRef.current = setInterval(async () => {
        try {
          const status = await catalogService.getImportStatus(taskId, {
            project_id: projectId,
          })
          setImportStatus({
            taskId,
            status: status.status,
            progress: status.progress,
            result: status.result,
            error: status.error,
          })
          if (status.status === 'completed' || status.status === 'failed') {
            clearImportPolling()
            clearTask('cat', projectId)
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.all() })
            }
          }
        } catch {
          clearImportPolling()
          clearTask('cat', projectId)
          setImportStatus((prev) =>
            prev ? { ...prev, status: 'failed', error: 'Failed to check import status' } : null
          )
        }
      }, 2000)
    },
    [clearImportPolling, projectId, queryClient]
  )

  // Start polling for VP import
  const startVPPolling = useCallback(
    (taskId: string) => {
      clearVPImportPolling()
      setVPImportStatus({ taskId, status: 'running' })
      saveTask('vp', projectId, taskId)

      vpImportIntervalRef.current = setInterval(async () => {
        try {
          const status = await variableProductService.getImportStatus(taskId, {
            project_id: projectId,
          })
          setVPImportStatus({
            taskId,
            status: status.status,
            progress: status.progress,
            result: status.result,
            error: status.error,
          })
          if (status.status === 'completed' || status.status === 'failed') {
            clearVPImportPolling()
            clearTask('vp', projectId)
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
            }
          }
        } catch {
          clearVPImportPolling()
          clearTask('vp', projectId)
          setVPImportStatus((prev) =>
            prev ? { ...prev, status: 'failed', error: 'Failed to check import status' } : null
          )
        }
      }, 2000)
    },
    [clearVPImportPolling, projectId, queryClient]
  )

  const startImgPolling = useCallback(
    (taskId: string) => {
      clearImgImportPolling()
      setImgImportStatus({ taskId, status: 'running' })
      saveTask('img', projectId, taskId)

      imgImportIntervalRef.current = setInterval(async () => {
        try {
          const status = await catalogImageService.getImportStatus(taskId, {
            project_id: projectId,
          })
          setImgImportStatus({
            taskId,
            status: status.status,
            progress: status.progress,
            result: status.result,
            error: status.error,
          })
          if (status.status === 'completed' || status.status === 'failed') {
            clearImgImportPolling()
            clearTask('img', projectId)
          }
        } catch {
          clearImgImportPolling()
          clearTask('img', projectId)
          setImgImportStatus((prev) =>
            prev ? { ...prev, status: 'failed', error: 'Failed to check import status' } : null
          )
        }
      }, 2000)
    },
    [clearImgImportPolling, projectId]
  )

  // Resume polling on mount if tasks are saved in localStorage
  useEffect(() => {
    const savedFullTask = getSavedTask('full', projectId)
    if (savedFullTask) startFullImportPolling(savedFullTask)

    const savedCatTask = getSavedTask('cat', projectId)
    if (savedCatTask) startCategoryPolling(savedCatTask)

    const savedVPTask = getSavedTask('vp', projectId)
    if (savedVPTask) startVPPolling(savedVPTask)

    const savedImgTask = getSavedTask('img', projectId)
    if (savedImgTask) startImgPolling(savedImgTask)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearImportPolling()
      clearVPImportPolling()
      clearImgImportPolling()
      clearFullImportPolling()
    }
  }, [
    clearImportPolling,
    clearVPImportPolling,
    clearImgImportPolling,
    clearFullImportPolling,
  ])

  const createTablesMutation = useMutation({
    mutationFn: (force = false) => projectService.createEcTables(projectId, force),
    meta: { successMessage: 'EC tables created successfully' },
  })

  // Single trigger that chains Superinventory → Categories → Images on the
  // backend in the right order. Replaces the need to fire steps 2, 3, 5
  // manually; those stay accessible under "Advanced" for re-running a stage.
  const importAllMutation = useMutation({
    mutationFn: () => {
      const names = swatchSpecNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return catalogService.importAll(
        {
          root_tree_id: null,
          swatch_spec_names: names.length > 0 ? names : undefined,
        },
        { project_id: projectId }
      )
    },
    onSuccess: (data) => {
      startFullImportPolling(data.task_id)
    },
  })

  const importCategoriesMutation = useMutation({
    mutationFn: () =>
      catalogService.importFromInventre({ root_tree_id: null }, { project_id: projectId }),
    onSuccess: (data) => {
      startCategoryPolling(data.task_id)
    },
  })

  const importVPMutation = useMutation({
    mutationFn: () => {
      const names = swatchSpecNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return variableProductService.importAll(
        { swatch_spec_names: names.length > 0 ? names : undefined },
        { project_id: projectId }
      )
    },
    onSuccess: (data) => {
      startVPPolling(data.task_id)
    },
  })

  const importSingleVPMutation = useMutation({
    mutationFn: () => {
      const names = singleSwatchNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return variableProductService.importFromSuperId(
        {
          super_id: singleSuperId.trim(),
          swatch_spec_names: names.length > 0 ? names : undefined,
        },
        { project_id: projectId }
      )
    },
    onSuccess: (data) => {
      setSingleVPResult(data as unknown as Record<string, unknown>)
      queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
    },
  })

  // Reset all state when project changes
  useEffect(() => {
    clearImportPolling()
    clearVPImportPolling()
    clearImgImportPolling()
    clearFullImportPolling()
    setImportStatus(null)
    setVPImportStatus(null)
    setImgImportStatus(null)
    setFullImportStatus(null)
    setSingleVPResult(null)
    createTablesMutation.reset()
    importSingleVPMutation.reset()

    // Resume polling for new project if tasks saved
    const savedFullTask = getSavedTask('full', projectId)
    if (savedFullTask) startFullImportPolling(savedFullTask)
    const savedCatTask = getSavedTask('cat', projectId)
    if (savedCatTask) startCategoryPolling(savedCatTask)
    const savedVPTask = getSavedTask('vp', projectId)
    if (savedVPTask) startVPPolling(savedVPTask)
    const savedImgTask = getSavedTask('img', projectId)
    if (savedImgTask) startImgPolling(savedImgTask)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const tablesResult = createTablesMutation.data

  return (
    <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
      <div className='max-w-xl flex flex-col gap-6 sm:gap-8'>
        {/* Header */}
        <div>
          <h2 className='text-[15px] font-semibold tracking-[-0.01em]'>
            Custom Catalog & Superinventory
          </h2>
          <p className='mt-1 text-[13px] text-text-tertiary leading-snug'>
            Set up EC tables and import data from EBMS. Tables only need to be created once — the
            operation is safe to repeat.
          </p>
        </div>

        {/* Step 1: Create EC Tables */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500'>
              <Database className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>1. Create EC Tables</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Creates EC_CATEGORY, EC_CATEGORY_PRODUCT, EC_CATEGORY_VP, EC_VARIABLE_PRODUCT,
                EC_SPEC_DEFINITION, EC_SPEC_OPTION, and related tables in the mirror database.
                Safe to run multiple times.
              </p>
              <div className='mt-3 flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => createTablesMutation.mutate(false)}
                  isPending={createTablesMutation.isPending}
                >
                  <Database className='size-3.5' />
                  Create / Migrate
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-destructive'
                  onClick={() => {
                    if (confirm('This will DROP and recreate all EC_ tables. All catalog data will be lost. Continue?')) {
                      createTablesMutation.mutate(true)
                    }
                  }}
                  isPending={createTablesMutation.isPending}
                >
                  Recreate
                </Button>
              </div>
              {tablesResult && (
                <div className='mt-2 rounded-md bg-bg-secondary p-2 text-[12px] break-all'>
                  {tablesResult.tables_created.length > 0 && (
                    <div className='text-emerald-600 dark:text-emerald-400'>
                      Created: {tablesResult.tables_created.join(', ')}
                    </div>
                  )}
                  {tablesResult.tables_existing.length > 0 && (
                    <div className='text-text-tertiary mt-1'>
                      Already existed: {tablesResult.tables_existing.join(', ')}
                    </div>
                  )}
                  {tablesResult.errors.length > 0 && (
                    <div className='text-destructive mt-1'>
                      Errors: {tablesResult.errors.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Import All — primary action, chains Superinv → Cats → Images */}
        <div className='rounded-lg border border-border bg-bg-secondary/40 p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500'>
              <Sparkles className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>2. Import All</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Runs Superinventory → Categories → Images in the correct dependency
                order in a single task. Use this for a fresh import or a normal
                re-import. Individual stages stay available under <em>Advanced</em>{' '}
                below for re-running a specific stage.
              </p>
              <div className='mt-3 flex flex-col gap-2'>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='full-swatch-names' className='text-[12px]'>
                    Swatch spec names (comma-separated, optional — used by Superinventory stage)
                  </Label>
                  <Input
                    id='full-swatch-names'
                    value={swatchSpecNames}
                    onChange={(e) => setSwatchSpecNames(e.target.value)}
                    placeholder='Lens Colour, Beta Color'
                    className='h-8 text-[13px]'
                  />
                </div>
                <Button
                  size='sm'
                  className='self-start'
                  onClick={() => importAllMutation.mutate()}
                  isPending={importAllMutation.isPending}
                  disabled={fullImportStatus?.status === 'running'}
                >
                  <Download className='size-3.5' />
                  Import All
                </Button>
                {fullImportStatus?.status === 'running' && (
                  <div>
                    <div className='text-[12px] text-text-tertiary animate-pulse whitespace-pre-line'>
                      {fullImportStatus.progress || 'Running...'}
                    </div>
                    <Button
                      variant='ghost'
                      size='xs'
                      className='mt-1 text-destructive'
                      onClick={() => {
                        if (fullImportStatus.taskId) {
                          catalogImageService.cancelImport(fullImportStatus.taskId, {
                            project_id: projectId,
                          })
                          clearFullImportPolling()
                          clearTask('full', projectId)
                          setFullImportStatus((prev) =>
                            prev ? { ...prev, status: 'failed', error: 'Cancelled' } : null
                          )
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {fullImportStatus?.status === 'completed' && (
                  <div className='rounded-md bg-bg-secondary p-2 text-[12px] text-emerald-600 dark:text-emerald-400 whitespace-pre-line'>
                    Import complete
                    {fullImportStatus.result
                      ? `: ${JSON.stringify(fullImportStatus.result)}`
                      : ''}
                  </div>
                )}
                {fullImportStatus?.status === 'failed' && (
                  <div className='text-[12px] text-destructive'>
                    Import failed{fullImportStatus.error ? `: ${fullImportStatus.error}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced — individual stages for re-running a single step */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <button
              type='button'
              className='flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-secondary/50'
            >
              <span className='font-medium'>Advanced — run a single stage</span>
              <ChevronDown
                className={`size-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-3 flex flex-col gap-4'>
            <p className='text-[12px] text-text-tertiary'>
              Re-run a single stage of the pipeline (e.g. only Images after fixing
              an asset). <strong>Order matters</strong> if running from scratch —
              Superinventory must run before Categories (Cats needs the VPs to link
              them), and Images runs last. Use <em>Import All</em> above for the
              normal flow.
            </p>

        {/* Step 2: Import Categories */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-green-500/10 text-green-500'>
              <FolderTree className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>Categories</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Imports all SHOW_WEB=true categories from INVENTRE into the custom catalog.
              </p>
              <Button
                variant='outline'
                size='sm'
                className='mt-3'
                onClick={() => importCategoriesMutation.mutate()}
                isPending={importCategoriesMutation.isPending}
                disabled={importStatus?.status === 'running'}
              >
                <Download className='size-3.5' />
                Import Categories
              </Button>
              {importStatus?.status === 'running' && (
                <div className='mt-2'>
                  <div className='text-[12px] text-text-tertiary animate-pulse whitespace-pre-line'>
                    {importStatus.progress || 'Running...'}
                  </div>
                  <Button
                    variant='ghost'
                    size='xs'
                    className='mt-1 text-destructive'
                    onClick={() => {
                      if (importStatus.taskId) {
                        catalogImageService.cancelImport(importStatus.taskId, { project_id: projectId })
                        clearImportPolling()
                        clearTask('cat', projectId)
                        setImportStatus((prev) => prev ? { ...prev, status: 'failed', error: 'Cancelled' } : null)
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {importStatus?.status === 'completed' && (
                <div className='mt-2 rounded-md bg-bg-secondary p-2 text-[12px] text-emerald-600 dark:text-emerald-400'>
                  Import complete{importStatus.result ? `: ${JSON.stringify(importStatus.result)}` : ''}
                </div>
              )}
              {importStatus?.status === 'failed' && (
                <div className='mt-2 text-[12px] text-destructive'>
                  Import failed{importStatus.error ? `: ${importStatus.error}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Import Variable Products */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-500'>
              <Layers className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>Superinventory</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Imports all SUPER_ID product groups from EBMS as superinventory items.
              </p>
              <div className='mt-3 flex flex-col gap-2'>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='swatch-names' className='text-[12px]'>
                    Swatch spec names (comma-separated, optional)
                  </Label>
                  <Input
                    id='swatch-names'
                    value={swatchSpecNames}
                    onChange={(e) => setSwatchSpecNames(e.target.value)}
                    placeholder='Lens Colour, Beta Color'
                    className='h-8 text-[13px]'
                  />
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='self-start'
                  onClick={() => importVPMutation.mutate()}
                  isPending={importVPMutation.isPending}
                  disabled={vpImportStatus?.status === 'running'}
                >
                  <Download className='size-3.5' />
                  Import Superinventory
                </Button>
                {vpImportStatus?.status === 'running' && (
                  <div>
                    <div className='text-[12px] text-text-tertiary animate-pulse whitespace-pre-line'>
                      {vpImportStatus.progress || 'Running...'}
                    </div>
                    <Button
                      variant='ghost'
                      size='xs'
                      className='mt-1 text-destructive'
                      onClick={() => {
                        if (vpImportStatus.taskId) {
                          catalogImageService.cancelImport(vpImportStatus.taskId, { project_id: projectId })
                          clearVPImportPolling()
                          clearTask('vp', projectId)
                          setVPImportStatus((prev) => prev ? { ...prev, status: 'failed', error: 'Cancelled' } : null)
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {vpImportStatus?.status === 'completed' && (
                  <div className='rounded-md bg-bg-secondary p-2 text-[12px] text-emerald-600 dark:text-emerald-400'>
                    Import complete{vpImportStatus.result ? `: ${JSON.stringify(vpImportStatus.result)}` : ''}
                  </div>
                )}
                {vpImportStatus?.status === 'failed' && (
                  <div className='text-[12px] text-destructive'>
                    Import failed{vpImportStatus.error ? `: ${vpImportStatus.error}` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Import Single VP */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-500'>
              <Package className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>Single Superinventory by SUPER_ID</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Import or re-import a single superinventory item by its SUPER_ID.
              </p>
              <div className='mt-3 flex flex-col gap-2'>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='single-super-id' className='text-[12px]'>
                    SUPER_ID
                  </Label>
                  <Input
                    id='single-super-id'
                    value={singleSuperId}
                    onChange={(e) => setSingleSuperId(e.target.value)}
                    placeholder='e.g. 4W-12B'
                    className='h-8 text-[13px]'
                  />
                </div>
                <div className='flex flex-col gap-1'>
                  <Label htmlFor='single-swatch-names' className='text-[12px]'>
                    Swatch spec names (comma-separated, optional)
                  </Label>
                  <Input
                    id='single-swatch-names'
                    value={singleSwatchNames}
                    onChange={(e) => setSingleSwatchNames(e.target.value)}
                    placeholder='Lens Colour, Beta Color'
                    className='h-8 text-[13px]'
                  />
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  className='self-start'
                  onClick={() => importSingleVPMutation.mutate()}
                  isPending={importSingleVPMutation.isPending}
                  disabled={!singleSuperId.trim()}
                >
                  <Download className='size-3.5' />
                  Import
                </Button>
                {importSingleVPMutation.isSuccess && singleVPResult && (
                  <div className='rounded-md bg-bg-secondary p-2 text-[12px] text-emerald-600 dark:text-emerald-400'>
                    Imported: {(singleVPResult as Record<string, unknown>).name as string ?? singleSuperId}
                  </div>
                )}
                {importSingleVPMutation.isError && (
                  <div className='text-[12px] text-destructive'>
                    Import failed: {(importSingleVPMutation.error as Error).message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Import Images */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-500'>
              <ImageIcon className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>Images</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Copies existing product and category images from the EBMS S3 bucket into our catalog. Generates thumbnails automatically. Skips already imported images.
              </p>
              <Button
                variant='outline'
                size='sm'
                className='mt-3'
                onClick={async () => {
                  const data = await catalogImageService.startImport({ project_id: projectId })
                  startImgPolling(data.task_id)
                }}
                disabled={imgImportStatus?.status === 'running'}
              >
                <Download className='size-3.5' />
                Import Images
              </Button>
              {imgImportStatus?.status === 'running' && (
                <div className='mt-2'>
                  <div className='text-[12px] text-text-tertiary animate-pulse whitespace-pre-line'>
                    {imgImportStatus.progress || 'Running...'}
                  </div>
                  <Button
                    variant='ghost'
                    size='xs'
                    className='mt-1 text-destructive'
                    onClick={() => {
                      if (imgImportStatus.taskId) {
                        catalogImageService.cancelImport(imgImportStatus.taskId, { project_id: projectId })
                        clearImgImportPolling()
                        clearTask('img', projectId)
                        setImgImportStatus((prev) => prev ? { ...prev, status: 'failed', error: 'Cancelled' } : null)
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              {imgImportStatus?.status === 'completed' && (
                <div className='mt-2 rounded-md bg-bg-secondary p-2 text-[12px] text-emerald-600 dark:text-emerald-400'>
                  Import complete{imgImportStatus.result ? `: ${JSON.stringify(imgImportStatus.result)}` : ''}
                </div>
              )}
              {imgImportStatus?.status === 'failed' && (
                <div className='mt-2 text-[12px] text-destructive'>
                  Import failed{imgImportStatus.error ? `: ${imgImportStatus.error}` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
