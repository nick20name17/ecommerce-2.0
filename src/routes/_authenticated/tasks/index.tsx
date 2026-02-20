import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { TaskModal } from './-components/task-modal'
import { TaskStatusManager } from './-components/task-status-manager'
import { TasksDataTable } from './-components/tasks-data-table'
import { TASK_QUERY_KEYS, getTasksQuery, getTaskStatusesQuery } from '@/api/task/query'
import type { TaskListItem, Task } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import {
  useLimitParam,
  useOffsetParam,
  useSearchParam,
  useTaskStatusParam
} from '@/hooks/use-query-params'
import { useProjectId } from '@/hooks/use-project-id'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksPage
})

function TasksPage() {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [taskStatusId, setTaskStatusId] = useTaskStatusParam()
  const [offset, setOffset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalTask, setModalTask] = useState<Task | TaskListItem | 'create' | null>(null)

  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  const params = {
    search: search || undefined,
    offset,
    limit,
    ordering,
    project_id: projectId ?? undefined,
    status: taskStatusId ?? undefined
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

  return (
    <div className='flex h-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Tasks</h1>
        <Button onClick={() => setModalTask('create')}>
          <Plus />
          Add Task
        </Button>
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <SearchFilter placeholder='Search tasks...' />
        <TaskStatusManager
          key={statuses.map((s) => s.id).sort().join(',')}
          projectId={projectId}
          statuses={statuses}
          value={taskStatusId}
          onValueChange={(id) => {
            setTaskStatusId(id)
            setOffset(null)
          }}
        />
      </div>

      <TasksDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={setModalTask}
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
    </div>
  )
}
