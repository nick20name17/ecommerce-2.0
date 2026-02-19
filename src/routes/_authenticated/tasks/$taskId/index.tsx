import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { TaskDeleteDialog } from './-components/task-delete-dialog'
import { TaskInfoCard } from './-components/task-info-card'
import { getTaskDetailQuery } from '@/api/task/query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectIdParam } from '@/hooks/use-query-params'

export const Route = createFileRoute('/_authenticated/tasks/$taskId/')({
  component: TaskDetailPage
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const navigate = useNavigate()
  const [projectId] = useProjectIdParam()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const id = Number(taskId)

  const { data: task, isLoading } = useQuery({
    ...getTaskDetailQuery(id),
    enabled: !Number.isNaN(id)
  })

  if (Number.isNaN(id)) {
    return (
      <div className='flex h-full flex-col gap-4'>
        <p className='text-muted-foreground'>Invalid task ID.</p>
        <Button variant='outline' asChild>
          <Link to='/tasks' search={projectId != null ? { project_id: projectId } : undefined}>
            Back to Tasks
          </Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex h-full flex-col gap-4'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-9 w-9' />
          <Skeleton className='h-8 w-48' />
        </div>
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  if (!task) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4'>
        <p className='text-muted-foreground'>Task not found.</p>
        <Button variant='outline' asChild>
          <Link
            to='/tasks'
            search={projectId != null ? { project_id: projectId } : undefined}
          >
            Back to Tasks
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col gap-4 overflow-y-auto p-1'>
      <div className='flex items-center gap-3 min-w-0'>
        <Button variant='ghost' size='icon' asChild>
          <Link
            to='/tasks'
            search={projectId != null ? { project_id: projectId } : undefined}
          >
            <ArrowLeft />
          </Link>
        </Button>
      </div>

      <TaskInfoCard task={task} onDelete={() => setDeleteOpen(true)} />

      <TaskDeleteDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() =>
          navigate({ to: '/tasks', search: projectId != null ? { project_id: projectId } : undefined })
        }
      />
    </div>
  )
}
