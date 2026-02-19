import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { getTaskStatusesQuery, TASK_QUERY_KEYS } from '@/api/task/query'
import {
  type CreateTaskFormValues,
  CreateTaskSchema,
  type Task,
  type TaskListItem,
  type UpdateTaskFormValues,
  UpdateTaskSchema
} from '@/api/task/schema'
import { taskService } from '@/api/task/service'
import { Button } from '@/components/ui/button'
import { TaskCustomerCombobox } from './customer-combobox'
import { OrderCombobox } from './order-combobox'
import { ProposalCombobox } from './proposal-combobox'
import { UserCombobox } from './user-combobox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TASK_PRIORITY, TASK_PRIORITY_LABELS } from '@/constants/task'
import { DatePicker } from '@/components/ui/date-picker'

interface TaskModalProps {
  task?: Task | TaskListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: number
}

export const TaskModal = ({ task, open, onOpenChange, projectId }: TaskModalProps) => {
  const isEdit = !!task

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        {isEdit ? (
          <EditForm task={task} onOpenChange={onOpenChange} projectId={projectId} />
        ) : (
          <CreateForm onOpenChange={onOpenChange} projectId={projectId} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SharedFields({
  statuses,
  projectId
}: {
  statuses: { id: number; name: string }[]
  projectId?: number
}) {
  const { control } = useFormContext<CreateTaskFormValues>()

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
      <Controller
        name='title'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className='sm:col-span-2'>
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
          <Field data-invalid={fieldState.invalid} className='sm:col-span-2'>
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
            <Select
              value={field.value != null ? String(field.value) : ''}
              onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
            >
              <SelectTrigger className='w-full' aria-invalid={fieldState.invalid}>
                <SelectValue placeholder='Select status' />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className='w-full' aria-invalid={fieldState.invalid}>
                <SelectValue placeholder='Select priority' />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <UserCombobox value={field.value} onChange={field.onChange} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className='space-y-3 sm:col-span-2 pt-2'>
        <p className='text-muted-foreground text-xs font-medium uppercase tracking-wide'>
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
                  value={field.value}
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
                <ProposalCombobox value={field.value} onChange={field.onChange} projectId={projectId} />
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
                  value={field.value}
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
  const defaultStatus = statuses.find((s) => s.is_default) ?? statuses[0]

  if (statusesLoading && statuses.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Loading statuses…</DialogDescription>
        </DialogHeader>
        <div className='py-6 text-center text-muted-foreground'>Loading…</div>
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
          <Button variant='outline' onClick={() => onOpenChange(false)}>
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
  defaultStatus: { id: number; name: string }
  statuses: { id: number; name: string; is_default?: boolean }[]
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

      <form id='task-form' onSubmit={handleSubmit}>
        <FieldGroup>
          <SharedFields
            statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
            projectId={projectId}
          />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
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

  const taskDescription = 'description' in task ? (task as Task).description ?? null : null
  const fullTask = task as Task
  const linkedOrder = 'linked_order_autoid' in fullTask ? fullTask.linked_order_autoid ?? null : null
  const linkedProposal = 'linked_proposal_autoid' in fullTask ? fullTask.linked_proposal_autoid ?? null : null
  const linkedCustomer = 'linked_customer_autoid' in fullTask ? fullTask.linked_customer_autoid ?? null : null

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

      <form id='task-form' onSubmit={handleSubmit}>
        <FieldGroup>
          <SharedFields
            statuses={statuses.map((s) => ({ id: s.id, name: s.name }))}
            projectId={projectId}
          />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
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
