import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Download, Layers, Plus, Search } from 'lucide-react'
import { useState } from 'react'

import { VPCreateDialog } from './-components/vp-create-dialog'
import { VP_QUERY_KEYS, getVariableProductsQuery } from '@/api/variable-product/query'
import type { VariableProductParams } from '@/api/variable-product/schema'
import { variableProductService } from '@/api/variable-product/service'
import { PageEmpty } from '@/components/common/page-empty'
import { Pagination } from '@/components/common/filters/pagination'
import { IVariableProducts, PAGE_COLORS, PageHeaderIcon } from '@/components/ds'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { useProjectId } from '@/hooks/use-project-id'
import { useLimitParam, useOffsetParam, useSearchParam } from '@/hooks/use-query-params'
import { cn } from '@/lib/utils'

const VariableProductsPage = () => {
  const navigate = useNavigate()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [projectId] = useProjectId()
  const [search, setSearch] = useSearchParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [createOpen, setCreateOpen] = useState(false)

  const params: VariableProductParams = {
    project_id: projectId ?? undefined,
    search: search || undefined,
    offset,
    limit,
  }

  const { data, isLoading } = useQuery({
    ...getVariableProductsQuery(params),
    placeholderData: keepPreviousData,
  })

  const results = data?.results ?? []

  const importAllMutation = useMutation({
    mutationFn: () =>
      variableProductService.importAll(
        { swatch_spec_names: [] },
        { project_id: projectId ?? undefined }
      ),
    meta: {
      successMessage: 'Variable products imported from EBMS',
      invalidatesQuery: VP_QUERY_KEYS.lists(),
    },
  })

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      {/* Header */}
      <header
        className={cn(
          'border-border flex h-12 shrink-0 items-center gap-2 border-b',
          isMobile ? 'px-3.5' : 'px-6'
        )}
      >
        <SidebarTrigger className='-ml-1' />
        <div className='flex items-center gap-1.5'>
          <PageHeaderIcon icon={IVariableProducts} color={PAGE_COLORS.variableProducts} />
          <h1 className='text-[14px] font-semibold tracking-[-0.01em]'>
            {isMobile ? 'VPs' : 'Variable Products'}
          </h1>
        </div>

        <div className='flex-1' />

        <div className='border-border bg-background focus-within:border-ring focus-within:ring-ring/50 hidden h-7 w-full max-w-[260px] items-center gap-1.5 rounded-[5px] border px-2 transition-[border-color,box-shadow] focus-within:ring-2 sm:flex'>
          <Search className='text-text-tertiary size-3 shrink-0' />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(null)
            }}
            placeholder='Search variable products...'
            className='placeholder:text-text-tertiary flex-1 bg-transparent text-[13px] outline-none'
          />
        </div>

        <div className='flex items-center gap-1.5'>
          {!isMobile && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => importAllMutation.mutate()}
              isPending={importAllMutation.isPending}
            >
              <Download className='size-3.5' />
              {!isTablet && 'Import from EBMS'}
            </Button>
          )}

          <Button size='sm' onClick={() => setCreateOpen(true)}>
            <Plus className='size-3.5' />
            {!isMobile && 'New'}
          </Button>
        </div>
      </header>

      {/* Mobile search bar */}
      {isMobile && (
        <div className='border-border border-b px-3.5 py-2'>
          <div className='border-border bg-background focus-within:border-ring focus-within:ring-ring/50 flex h-8 items-center gap-1.5 rounded-[5px] border px-2 transition-[border-color,box-shadow] focus-within:ring-2'>
            <Search className='text-text-tertiary size-3 shrink-0' />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOffset(null)
              }}
              placeholder='Search...'
              className='placeholder:text-text-tertiary flex-1 bg-transparent text-[13px] outline-none'
            />
          </div>
        </div>
      )}

      {/* Column headers — desktop/tablet only */}
      {!isMobile && !isLoading && results.length > 0 && (
        <div
          className={cn(
            'border-border bg-bg-secondary text-text-tertiary sticky top-0 z-10 flex items-center border-b py-1 text-[13px] font-medium select-none',
            isTablet ? 'gap-4 px-5' : 'gap-6 px-6'
          )}
        >
          <div className='min-w-0 flex-1'>Name</div>
          {!isTablet && <div className='w-[200px] shrink-0'>Slug</div>}
          <div className='w-[80px] shrink-0 text-center'>Status</div>
        </div>
      )}

      {/* List */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) =>
            isMobile ? (
              <div key={i} className='border-border-light border-b px-3.5 py-2.5'>
                <Skeleton className='mb-1 h-3.5 w-36 rounded' />
                <Skeleton className='h-3 w-20 rounded' />
              </div>
            ) : (
              <div
                key={i}
                className={cn(
                  'flex items-center border-b border-border-light py-2',
                  isTablet ? 'gap-4 px-5' : 'gap-6 px-6'
                )}
              >
                <div className='flex min-w-0 flex-1 items-center gap-2'>
                  <Skeleton className='h-3.5 w-40 rounded' />
                </div>
                {!isTablet && <Skeleton className='h-3.5 w-[150px] rounded' />}
                <Skeleton className='h-5 w-[60px] rounded-full' />
              </div>
            )
          )
        ) : results.length === 0 ? (
          <PageEmpty
            icon={Layers}
            title='No variable products'
            description='Create a variable product or import from EBMS.'
            action={
              <Button size='sm' onClick={() => setCreateOpen(true)}>
                <Plus className='size-3.5' />
                New Variable Product
              </Button>
            }
          />
        ) : isMobile ? (
          results.map((vp) => (
            <div
              key={vp.id}
              className='border-b border-border-light px-3.5 py-2.5 active:bg-bg-hover transition-colors cursor-pointer'
              onClick={() =>
                navigate({
                  to: '/variable-products/$vpId',
                  params: { vpId: vp.id },
                })
              }
            >
              <div className='flex items-center gap-2'>
                <div className='text-[13px] font-medium truncate flex-1'>{vp.name}</div>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    vp.active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-text-tertiary'
                  )}
                >
                  {vp.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {vp.description && (
                <div className='text-[12px] text-text-tertiary truncate mt-0.5'>
                  {vp.description}
                </div>
              )}
            </div>
          ))
        ) : (
          results.map((vp) => (
            <div
              key={vp.id}
              className={cn(
                'flex items-center border-b border-border-light py-2 hover:bg-bg-hover transition-colors cursor-pointer',
                isTablet ? 'gap-4 px-5' : 'gap-6 px-6'
              )}
              onClick={() =>
                navigate({
                  to: '/variable-products/$vpId',
                  params: { vpId: vp.id },
                })
              }
            >
              <div className='min-w-0 flex-1'>
                <div className='text-[13px] font-medium truncate'>{vp.name}</div>
                {vp.description && (
                  <div className='text-[12px] text-text-tertiary truncate'>{vp.description}</div>
                )}
              </div>
              {!isTablet && (
                <div className='w-[200px] shrink-0 text-[13px] text-text-secondary truncate'>
                  {vp.slug}
                </div>
              )}
              <div className='w-[80px] shrink-0 flex justify-center'>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                    vp.active
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted text-text-tertiary'
                  )}
                >
                  {vp.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className={cn('border-border shrink-0 border-t py-2', isMobile ? 'px-3.5' : 'px-6')}>
        <Pagination totalCount={data?.count ?? 0} />
      </div>

      {/* Dialogs */}
      <VPCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
      />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/variable-products/')({
  component: VariableProductsPage,
  head: () => ({
    meta: [{ title: 'Variable Products' }],
  }),
})
