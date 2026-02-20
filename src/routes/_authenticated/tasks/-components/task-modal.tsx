import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { TaskCustomerCombobox } from './customer-combobox'
import { OrderCombobox } from './order-combobox'
import { ProposalCombobox } from './proposal-combobox'
import { TaskStatusManager } from './task-status-manager'
import { UserCombobox } from './user-combobox'
import { TASK_QUERY_KEYS, getTaskStatusesQuery } from '@/api/task/query'
import {
  type CreateTaskFormValues,
  CreateTaskSchema,
  type Task,
  type TaskListItem,
  type TaskStatus,
  type UpdateTaskFormValues,
  UpdateTaskSchema
} from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { TaskPrioritySelect } from '@/components/common/task-priority-select'
import { TaskStatusSelect } from '@/components/common/task-status-select'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TASK_PRIORITY } from '@/constants/task'

interface TaskModalProps {
  task?: Task | TaskListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number
}

export const TaskModal = ({ task, open, onOpenChange, projectId }: TaskModalProps) => {
  const isEdit = !!task

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-2xl'>
        {isEdit ? (
          <EditForm
            task={task}
            onOpenChange={onOpenChange}
            projectId={projectId}
          />
        ) : (
          <CreateForm
            onOpenChange={onOpenChange}
            projectId={projectId}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SharedFields({ statuses, projectId }: { statuses: TaskStatus[]; projectId?: number }) {
  const { control } = useFormContext<CreateTaskFormValues>()

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      <Controller
        name='title'
        control={control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className='sm:col-span-2'
          >
            <FieldLabel htmlFor='task-title'>Title</FieldLabel>
            <Input
              {...field}
              id='task-title'
              placeholder='Task title'
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='description'
        control={control}
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid}
            className='sm:col-span-2'
          >
            <FieldLabel htmlFor='task-description'>Description</FieldLabel>
            <Textarea
              {...field}
              id='task-description'
              placeholder='Optional description'
              value={field.value ?? ''}
              rows={2}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='status'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Status</FieldLabel>
            <div className='flex items-center gap-2'>
              <TaskStatusSelect
                statuses={statuses}
                value={field.value !== undefined && field.value !== null ? field.value : null}
                onValueChange={(id) => field.onChange(id ?? undefined)}
                placeholder='Select status'
              />
              <TaskStatusManager
                projectId={projectId}
                statuses={statuses}
              />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='priority'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Priority</FieldLabel>
            <TaskPrioritySelect
              value={field.value ?? ''}
              onValueChange={(v) => field.onChange(v || undefined)}
              placeholder='Select priority'
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='due_date'
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Due date</FieldLabel>
            <DatePicker
              value={field.value ? new Date(field.value) : undefined}
              onChange={(d) => field.onChange(d ? d.toISOString().slice(0, 10) : null)}
              placeholder='Pick a date'
            />
          </Field>
        )}
      />

      <Controller
        name='responsible_user'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Responsible user</FieldLabel>
            <UserCombobox
              value={field.value ?? null}
              onChange={field.onChange}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className='space-y-3 pt-2 sm:col-span-2'>
        <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
          Linked items (optional)
        </p>
        <div className='grid gap-3 sm:grid-cols-2'>
          <Controller
            name='linked_order_autoid'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Order</FieldLabel>
                <OrderCombobox
                  value={field.value ?? null}
                  onChange={field.onChange}
                  projectId={projectId}
                />
              </Field>
            )}
          />
          <Controller
            name='linked_proposal_autoid'
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel>Proposal</FieldLabel>
                <ProposalCombobox
                  value={field.value ?? null}
                  onChange={field.onChange}
                  projectId={projectId}
                />
              </Field>
            )}
          />
          <Controller
            name='linked_customer_autoid'
            control={control}
            render={({ field }) => (
              <Field className='sm:col-span-2'>
                <FieldLabel>Customer</FieldLabel>
                <TaskCustomerCombobox
                  value={field.value ?? null}
                  onChange={field.onChange}
                  projectId={projectId}
                />
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function CreateForm({
  onOpenChange,
  projectId
}: {
  onOpenChange: (open: boolean) => void
  projectId?: number
}) {
  const { data: statusesData, isLoading: statusesLoading } = useQuery(
    getTaskStatusesQuery(projectId)
  )
  const statuses = statusesData?.results ?? []
  const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]!

  if (statusesLoading && statuses.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Loading statuses…</DialogDescription>
        </DialogHeader>
        <div className='text-muted-foreground py-6 text-center'>Loading…</div>
      </>
    )
  }

  if (!statusesLoading && statuses.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            No task statuses available. Create statuses in project settings first.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <CreateFormInner
      defaultStatus={defaultStatus!}
      statuses={statuses}
      onOpenChange={onOpenChange}
      projectId={projectId}
    />
  )
}

function CreateFormInner({
  defaultStatus,
  statuses,
  onOpenChange,
  projectId
}: {
  defaultStatus: TaskStatus
  statuses: TaskStatus[]
  onOpenChange: (open: boolean) => void
  projectId?: number
}) {
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: {
      title: '',
      description: null,
      status: defaultStatus.id,
      priority: TASK_PRIORITY.medium,
      due_date: null,
      responsible_user: null,
      linked_order_autoid: null,
      linked_proposal_autoid: null,
      linked_customer_autoid: null
    }
  })

  const mutation = useMutation({
    mutationFn: (payload: CreateTaskFormValues) =>
      taskService.create({
        title: payload.title,
        description: payload.description ?? undefined,
        status: payload.status,
        priority: payload.priority,
        due_date: payload.due_date || null,
        responsible_user: payload.responsible_user ?? null,
        linked_order_autoid: payload.linked_order_autoid ?? null,
        linked_proposal_autoid: payload.linked_proposal_autoid ?? null,
        linked_customer_autoid: payload.linked_customer_autoid ?? null,
        project: projectId
      }),
    meta: {
      successMessage: 'Task created successfully',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader>
        <DialogTitle>Create Task</DialogTitle>
        <DialogDescription>Add a new task.</DialogDescription>
      </DialogHeader>

      <form
        id='task-form'
        onSubmit={handleSubmit}
      >
        <FieldGroup>
          <SharedFields
            statuses={statuses}
            projectId={projectId}
          />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button
          variant='outline'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='task-form'
          isPending={mutation.isPending}
          disabled={mutation.isPending}
        >
          Create
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}

function EditForm({
  task,
  onOpenChange,
  projectId
}: {
  task: Task | TaskListItem
  onOpenChange: (open: boolean) => void
  projectId?: number
}) {
  const { data: statusesData } = useQuery(getTaskStatusesQuery(projectId ?? task.project))
  const statuses = statusesData?.results ?? []

  const taskDescription = 'description' in task ? ((task as Task).description ?? null) : null
  const fullTask = task as Task
  const linkedOrder =
    'linked_order_autoid' in fullTask ? (fullTask.linked_order_autoid ?? null) : null
  const linkedProposal =
    'linked_proposal_autoid' in fullTask ? (fullTask.linked_proposal_autoid ?? null) : null
  const linkedCustomer =
    'linked_customer_autoid' in fullTask ? (fullTask.linked_customer_autoid ?? null) : null

  const form = useForm<UpdateTaskFormValues>({
    resolver: zodResolver(UpdateTaskSchema),
    defaultValues: {
      title: task.title,
      description: taskDescription,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? null,
      responsible_user: task.responsible_user ?? null,
      linked_order_autoid: linkedOrder,
      linked_proposal_autoid: linkedProposal,
      linked_customer_autoid: linkedCustomer
    }
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateTaskFormValues) =>
      taskService.update(task.id, {
        title: payload.title,
        description: payload.description ?? undefined,
        status: payload.status,
        priority: payload.priority,
        due_date: payload.due_date ?? null,
        responsible_user: payload.responsible_user ?? null,
        linked_order_autoid: payload.linked_order_autoid ?? null,
        linked_proposal_autoid: payload.linked_proposal_autoid ?? null,
        linked_customer_autoid: payload.linked_customer_autoid ?? null
      }),
    meta: {
      successMessage: 'Task updated successfully',
      invalidatesQuery: TASK_QUERY_KEYS.lists()
    },
    onSuccess: () => onOpenChange(false)
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogDescription>Update task details.</DialogDescription>
      </DialogHeader>

      <form
        id='task-form'
        onSubmit={handleSubmit}
      >
        <FieldGroup>
          <SharedFields
            statuses={statuses}
            projectId={projectId}
          />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button
          variant='outline'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='task-form'
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}
