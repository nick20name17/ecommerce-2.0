import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckSquare, Filter, Plus } from 'lucide-react'
import { useState } from 'react'

import { TaskDeleteDialog } from './$taskId/-components/task-delete-dialog'
import { TaskFiltersPanel } from './-components/task-filters-panel'
import { TaskModal } from './-components/task-modal'
import { TasksDataTable } from './-components/tasks-data-table'
import { TASK_QUERY_KEYS, getTasksQuery, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskListItem, Task } from '@/api/task/schema'
import type { TaskPriority } from '@/constants/task'
import { taskService } from '@/api/task/service'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { useOrdering } from '@/hooks/use-ordering'
import {
  useLimitParam,
  useOffsetParam,
  useSearchParam,
  useTaskDueFromParam,
  useTaskDueToParam,
  useTaskPriorityParam,
  useTaskResponsibleParam,
  useTaskStatusParam
} from '@/hooks/use-query-params'
import { useProjectId } from '@/hooks/use-project-id'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksPage,
  head: () => ({
    meta: [{ title: 'Tasks' }]
  })
})

function TasksPage() {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [taskStatusId, setTaskStatusId] = useTaskStatusParam()
  const [priority, setPriority] = useTaskPriorityParam()
  const [responsibleUserId, setResponsibleUserId] = useTaskResponsibleParam()
  const [dueFrom, setDueFrom] = useTaskDueFromParam()
  const [dueTo, setDueTo] = useTaskDueToParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const [filtersOpen, setFiltersOpen] = useState(
    () =>
      taskStatusId != null ||
      !!priority ||
      responsibleUserId != null ||
      dueFrom != null ||
      dueTo != null
  )
  const [modalTask, setModalTask] = useState<Task | TaskListItem | 'create' | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null)

  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  const hasAnyFilter =
    taskStatusId != null ||
    !!priority ||
    responsibleUserId != null ||
    dueFrom != null ||
    dueTo != null

  const params = {
    search: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined,
    status: taskStatusId ?? undefined,
    priority: (priority === '' ? undefined : priority) as TaskPriority | undefined,
    responsible_user: responsibleUserId ?? undefined,
    due_date_from: dueFrom instanceof Date ? dueFrom.toISOString() : undefined,
    due_date_to: dueTo instanceof Date ? dueTo.toISOString() : undefined
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTasksQuery(params),
    placeholderData: keepPreviousData
  })

  const editingTask = typeof modalTask === 'object' && modalTask !== null ? modalTask : null

  const statusChangeMutation = useMutation({
    mutationFn: ({ taskId, statusId }: { taskId: number; statusId: number }) =>
      taskService.update(taskId, { status: statusId }),
    meta: {
      successMessage: 'Status updated',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    }
  })

  const handleStatusChange = (task: TaskListItem, statusId: number) => {
    statusChangeMutation.mutate({ taskId: task.id, statusId })
  }

  const handleView = (task: TaskListItem) => {
    navigate({ to: '/tasks/$taskId', params: { taskId: String(task.id) } })
  }

  const resetOffset = () => setOffset(null)
  const clearFilters = () => {
    setTaskStatusId(null)
    setPriority('')
    setResponsibleUserId(null)
    setDueFrom(null)
    setDueTo(null)
    setOffset(null)
  }

  return (
    <div className='flex h-full flex-col gap-5'>
      <header className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <CheckSquare className='size-5' />
          </div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Tasks</h1>
            <p className='text-sm text-muted-foreground'>{data?.count ?? 0} total</p>
          </div>
        </div>
        <Button onClick={() => setModalTask('create')} className='gap-2'>
          <Plus className='size-4' />
          Create Task
        </Button>
      </header>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className='flex flex-wrap items-center gap-2'>
          <div className='min-w-0 flex-1 sm:max-w-xs'>
            <SearchFilter placeholder='Search tasks...' />
          </div>
          <CollapsibleTrigger asChild>
            <Button variant='outline' size='default'>
              <Filter className='size-4' />
              {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <TaskFiltersPanel
            className='mt-3'
            statuses={statuses}
            taskStatusId={taskStatusId}
            onTaskStatusChange={(id) => {
              setTaskStatusId(id)
              resetOffset()
            }}
            priority={priority as TaskPriority | ''}
            onPriorityChange={(v) => {
              setPriority((v === '' ? '' : v) as TaskPriority | '')
              resetOffset()
            }}
            responsibleUserId={responsibleUserId}
            onResponsibleChange={(id) => {
              setResponsibleUserId(id)
              resetOffset()
            }}
            dueFrom={dueFrom ?? undefined}
            onDueFromChange={(d) => {
              setDueFrom(d ?? null)
              resetOffset()
            }}
            dueTo={dueTo ?? undefined}
            onDueToChange={(d) => {
              setDueTo(d ?? null)
              resetOffset()
            }}
            hasAnyFilter={hasAnyFilter}
            onClearFilters={clearFilters}
          />
        </CollapsibleContent>
      </Collapsible>

      <TasksDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={setModalTask}
        onDelete={(task) => setTaskToDelete(task)}
        onView={handleView}
        statuses={statuses}
        onStatusChange={handleStatusChange}
      />

      <Pagination totalCount={data?.count ?? 0} />

      <TaskModal
        key={editingTask && 'id' in editingTask ? editingTask.id : 'create'}
        open={modalTask !== null}
        onOpenChange={(open) => !open && setModalTask(null)}
        task={editingTask ?? undefined}
        projectId={projectId ?? undefined}
      />

      <TaskDeleteDialog
        task={taskToDelete}
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        onDeleted={() => setTaskToDelete(null)}
      />
    </div>
  )
}
