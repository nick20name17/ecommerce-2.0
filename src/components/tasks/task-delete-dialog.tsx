import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { Task, TaskListItem } from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

interface TaskDeleteDialogProps {
  task: Task | TaskListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export const TaskDeleteDialog = ({
  task,
  open,
  onOpenChange,
  onDeleted
}: TaskDeleteDialogProps) => {
  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskService.delete(id),
    meta: {
      successMessage: 'Todo deleted',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
      onDeleted()
    }
  })

  const handleDelete = () => {
    if (!task) return
    deleteMutation.mutate(task.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Todo</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{task?.title}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            isPending={deleteMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
