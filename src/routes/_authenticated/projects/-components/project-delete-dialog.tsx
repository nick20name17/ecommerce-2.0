import { useMutation } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'

import { PROJECT_QUERY_KEYS } from '@/api/project/query'
import type { Project } from '@/api/project/schema'
import { projectService } from '@/api/project/service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ProjectDeleteDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectDeleteDialog = ({
  project,
  open,
  onOpenChange,
}: ProjectDeleteDialogProps) => {
  const deleteMutation = useMutation({
    mutationFn: projectService.delete,
    meta: {
      successMessage: 'Project deleted successfully',
      invalidatesQuery: PROJECT_QUERY_KEYS.lists(),
    },
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  const handleDelete = () => {
    if (!project) return
    deleteMutation.mutate(project.id)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className='bg-destructive/10 text-destructive'>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Project</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{' '}
            <span className='font-medium'>{project?.name}</span>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
