'use no memo'

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import { TaskDeleteDialog } from '@/routes/_authenticated/tasks/$taskId/-components/task-delete-dialog'
import { TaskModal } from '@/routes/_authenticated/tasks/-components/task-modal'
import { TasksDataTable } from '@/routes/_authenticated/tasks/-components/tasks-data-table'
import {
  TASK_QUERY_KEYS,
  getTasksQuery,
  getTaskStatusesQuery
} from '@/api/task/query'
import type { TaskListItem } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Pagination } from '@/components/common/filters/pagination'
import { SearchFilter } from '@/components/common/filters/search'
import { Button } from '@/components/ui/button'
import { useOrdering } from '@/hooks/use-ordering'
import {
  useLimitParam,
  useOffsetParam,
  useSearchParam
} from '@/hooks/use-query-params'
import { useProjectId } from '@/hooks/use-project-id'

interface CustomerTasksTabProps {
  customerId: string
}

export function CustomerTasksTab({ customerId }: CustomerTasksTabProps) {
  const navigate = useNavigate()
  const [search] = useSearchParam()
  const [offset] = useOffsetParam()
  const [limit] = useLimitParam()
  const [projectId] = useProjectId()
  const { sorting, setSorting, ordering } = useOrdering()

  const [modalTask, setModalTask] = useState<TaskListItem | 'create' | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null)

  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? null))
  const statuses = statusesData?.results ?? []

  const params = useMemo(
    () => ({
      linked_customer_autoid: customerId,
      search: search || undefined,
      offset,
      limit,
      ordering,
      project_id: projectId ?? undefined
    }),
    [customerId, search, offset, limit, ordering, projectId]
  )

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getTasksQuery(params),
    placeholderData: keepPreviousData
  })

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

  const editingTask =
    typeof modalTask === 'object' && modalTask !== null ? modalTask : null

  return (
    <div className='flex h-full min-w-0 flex-col gap-4'>
      <div className='flex items-center justify-between gap-2'>
        <SearchFilter placeholder="Search to-do's..." />
        <Button
          onClick={() => setModalTask('create')}
          className='h-9 gap-2 shrink-0'
        >
          <Plus className='size-4' />
          Add task
        </Button>
      </div>

      <TasksDataTable
        data={data?.results ?? []}
        isLoading={isLoading || isPlaceholderData}
        sorting={sorting}
        setSorting={setSorting}
        onEdit={setModalTask}
        onDelete={setTaskToDelete}
        onView={handleView}
        statuses={statuses}
        onStatusChange={handleStatusChange}
        fitWidth
      />

      <Pagination totalCount={data?.count ?? 0} />

      <TaskModal
        key={
          editingTask && 'id' in editingTask
            ? editingTask.id
            : `create-${modalTask === 'create' ? customerId : ''}`
        }
        open={modalTask !== null}
        onOpenChange={(open) => !open && setModalTask(null)}
        task={editingTask ?? undefined}
        projectId={projectId ?? undefined}
        defaultLinkedCustomerAutoid={modalTask === 'create' ? customerId : undefined}
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
