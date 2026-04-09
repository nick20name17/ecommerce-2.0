import { useMutation } from '@tanstack/react-query'
import { Database, Download, FolderTree, Layers } from 'lucide-react'
import { useState } from 'react'

import { CATALOG_QUERY_KEYS } from '@/api/catalog/query'
import { catalogService } from '@/api/catalog/service'
import { projectService } from '@/api/project/service'
import { VP_QUERY_KEYS } from '@/api/variable-product/query'
import { variableProductService } from '@/api/variable-product/service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CatalogSectionProps {
  projectId: number
}

export const CatalogSection = ({ projectId }: CatalogSectionProps) => {
  const [swatchSpecNames, setSwatchSpecNames] = useState('')

  const createTablesMutation = useMutation({
    mutationFn: () => projectService.createEcTables(projectId),
    meta: { successMessage: 'EC tables created successfully' },
  })

  const importCategoriesMutation = useMutation({
    mutationFn: () =>
      catalogService.importFromInventre({ root_tree_id: null }, { project_id: projectId }),
    meta: {
      successMessage: 'Categories imported from EBMS',
      invalidatesQuery: CATALOG_QUERY_KEYS.all(),
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
    meta: {
      successMessage: 'Variable products imported from EBMS',
      invalidatesQuery: VP_QUERY_KEYS.lists(),
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
              >
                <Download className='size-3.5' />
                Import Categories
              </Button>
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
                >
                  <Download className='size-3.5' />
                  Import Variable Products
                </Button>
                {importVPMutation.data && (
                  <div className='rounded-md bg-bg-secondary p-2 text-[12px]'>
                    <span className='text-emerald-600 dark:text-emerald-400'>
                      Imported: {importVPMutation.data.imported}
                    </span>
                    {importVPMutation.data.skipped > 0 && (
                      <span className='ml-3 text-text-tertiary'>
                        Skipped: {importVPMutation.data.skipped}
                      </span>
                    )}
                    {importVPMutation.data.errors.length > 0 && (
                      <div className='mt-1 text-destructive'>
                        Errors: {importVPMutation.data.errors.join(', ')}
                      </div>
                    )}
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
