import { useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useState } from 'react'

import { TASK_QUERY_KEYS } from '@/api/task/query'
import type { Task } from '@/api/task/schema'
import { taskService } from '@/api/task/service'

const DATE_TIME_LONG = 'MMM d, yyyy, h:mm a'

interface TaskContentPanelProps {
  task: Task
}

export const TaskContentPanel = ({ task }: TaskContentPanelProps) => {
  const [description, setDescription] = useState(task.description ?? '')

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof taskService.update>[1]) =>
      taskService.update(task.id, payload),
    meta: {
      successMessage: 'Todo updated',
      invalidatesQuery: TASK_QUERY_KEYS.all()
    }
  })

  const handleDescriptionBlur = () => {
    const value = description.trim() || null
    if (value !== (task.description ?? null)) {
      updateMutation.mutate({ description: value })
    }
  }

  const updatedDate = task.updated_at ? new Date(task.updated_at) : null

  return (
    <div className='flex flex-col gap-3'>
      <div className='text-xs font-semibold uppercase tracking-[0.06em] text-text-tertiary'>
        Description
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={handleDescriptionBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        placeholder='Add a description...'
        rows={6}
        className='w-full resize-none rounded-[6px] border border-border bg-transparent px-3 py-2 text-sm leading-relaxed text-text-secondary placeholder:text-text-tertiary focus:border-primary focus:outline-none'
      />

      {updatedDate && (
        <p className='text-xs text-text-tertiary'>
          Last updated {format(updatedDate, DATE_TIME_LONG)}
        </p>
      )}
    </div>
  )
}
