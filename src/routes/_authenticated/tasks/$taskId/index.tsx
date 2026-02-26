import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { TaskDeleteDialog } from './-components/task-delete-dialog'
import { TaskInfoCard } from './-components/task-info-card'
import { getTaskDetailQuery } from '@/api/task/query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
export const Route = createFileRoute('/_authenticated/tasks/$taskId/')({
  component: TaskDetailPage,
  head: () => ({
    meta: [{ title: 'Todo' }]
  })
})

function TaskDetailPage() {
  const { taskId } = Route.useParams()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const id = Number(taskId)

  const { data: task, isLoading } = useQuery({
    ...getTaskDetailQuery(id),
    enabled: !Number.isNaN(id)
  })

  if (Number.isNaN(id)) {
    return (
      <div className='flex h-full flex-col gap-4'>
        <p className='text-muted-foreground'>Invalid todo ID.</p>
        <Button variant='outline' onClick={() => router.history.back()}>
          Back to To-Do's
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
        <p className='text-muted-foreground'>Todo not found.</p>
        <Button variant='outline' onClick={() => router.history.back()}>
          Back to To-Do's
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-4'>
      <div className='flex shrink-0 items-center gap-3 min-w-0'>
        <Button variant='ghost' size='icon' onClick={() => router.history.back()}>
          <ArrowLeft />
        </Button>
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto'>
        <TaskInfoCard task={task} onDelete={() => setDeleteOpen(true)} />
      </div>

      <TaskDeleteDialog
        task={task}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.history.back()}
      />
    </div>
  )
}
