import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Download, FolderTree, Layers, Package } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import type { ImportStatusResponse } from '@/api/catalog/schema'
import { catalogService } from '@/api/catalog/service'
import { projectService } from '@/api/project/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
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

const LS_KEY_CAT_IMPORT = 'catalog_import_task'
const LS_KEY_VP_IMPORT = 'vp_import_task'

function saveTask(key: string, taskId: string) {
  localStorage.setItem(key, taskId)
}

function clearTask(key: string) {
  localStorage.removeItem(key)
}

function getSavedTask(key: string): string | null {
  return localStorage.getItem(key)
}

export const CatalogSection = ({ projectId }: CatalogSectionProps) => {
  const [swatchSpecNames, setSwatchSpecNames] = useState('')
  const [singleSuperId, setSingleSuperId] = useState('')
  const [singleSwatchNames, setSingleSwatchNames] = useState('')
  const [importStatus, setImportStatus] = useState<ImportPollState | null>(null)
  const [vpImportStatus, setVPImportStatus] = useState<ImportPollState | null>(null)
  const [singleVPResult, setSingleVPResult] = useState<Record<string, unknown> | null>(null)
  const importIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const vpImportIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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

  // Start polling for category import
  const startCategoryPolling = useCallback(
    (taskId: string) => {
      clearImportPolling()
      setImportStatus({ taskId, status: 'running' })
      saveTask(LS_KEY_CAT_IMPORT, taskId)

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
            clearTask(LS_KEY_CAT_IMPORT)
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: CATALOG_QUERY_KEYS.all() })
            }
          }
        } catch {
          clearImportPolling()
          clearTask(LS_KEY_CAT_IMPORT)
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
      saveTask(LS_KEY_VP_IMPORT, taskId)

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
            clearTask(LS_KEY_VP_IMPORT)
            if (status.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
            }
          }
        } catch {
          clearVPImportPolling()
          clearTask(LS_KEY_VP_IMPORT)
          setVPImportStatus((prev) =>
            prev ? { ...prev, status: 'failed', error: 'Failed to check import status' } : null
          )
        }
      }, 2000)
    },
    [clearVPImportPolling, projectId, queryClient]
  )

  // Resume polling on mount if tasks are saved in localStorage
  useEffect(() => {
    const savedCatTask = getSavedTask(LS_KEY_CAT_IMPORT)
    if (savedCatTask) {
      startCategoryPolling(savedCatTask)
    }

    const savedVPTask = getSavedTask(LS_KEY_VP_IMPORT)
    if (savedVPTask) {
      startVPPolling(savedVPTask)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearImportPolling()
      clearVPImportPolling()
    }
  }, [clearImportPolling, clearVPImportPolling])

  const createTablesMutation = useMutation({
    mutationFn: () => projectService.createEcTables(projectId),
    meta: { successMessage: 'EC tables created successfully' },
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
      setSingleVPResult(data as Record<string, unknown>)
      queryClient.invalidateQueries({ queryKey: VP_QUERY_KEYS.lists() })
    },
  })

  const tablesResult = createTablesMutation.data

  return (
    <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
      <div className='max-w-xl flex flex-col gap-6 sm:gap-8'>
        {/* Header */}
        <div>
          <h2 className='text-[15px] font-semibold tracking-[-0.01em]'>
            Custom Catalog & Variable Products
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
              <Button
                variant='outline'
                size='sm'
                className='mt-3'
                onClick={() => createTablesMutation.mutate()}
                isPending={createTablesMutation.isPending}
              >
                <Database className='size-3.5' />
                Create EC Tables
              </Button>
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

        {/* Step 2: Import Categories */}
        <div className='rounded-lg border border-border p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex size-8 shrink-0 items-center justify-center rounded-md bg-green-500/10 text-green-500'>
              <FolderTree className='size-4' />
            </div>
            <div className='flex-1'>
              <h3 className='text-[13px] font-semibold'>2. Import Categories</h3>
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
                <div className='mt-2 text-[12px] text-text-tertiary animate-pulse'>
                  {importStatus.progress || 'Running...'}
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
              <h3 className='text-[13px] font-semibold'>3. Import Variable Products</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Imports all SUPER_ID product groups from EBMS as variable products.
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
                  Import Variable Products
                </Button>
                {vpImportStatus?.status === 'running' && (
                  <div className='text-[12px] text-text-tertiary animate-pulse'>
                    {vpImportStatus.progress || 'Running...'}
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
              <h3 className='text-[13px] font-semibold'>4. Import Single VP by SUPER_ID</h3>
              <p className='mt-0.5 text-[12px] text-text-tertiary'>
                Import or re-import a single variable product by its SUPER_ID.
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
                  Import VP
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
      </div>
    </div>
  )
}
