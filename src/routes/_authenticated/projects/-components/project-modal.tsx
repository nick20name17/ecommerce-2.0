import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { PROJECT_QUERY_KEYS } from '@/api/project/query'
import {
  type CreateProjectFormValues,
  CreateProjectSchema,
  type Project,
  type UpdateProjectFormValues,
  UpdateProjectSchema,
} from '@/api/project/schema'
import { projectService } from '@/api/project/service'
import { PasswordInput } from '@/components/common/inputs/password-input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ProjectModalProps {
  project?: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectModal = ({ project, open, onOpenChange }: ProjectModalProps) => {
  const isEdit = !!project

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
        {isEdit ? (
          <EditForm project={project} onOpenChange={onOpenChange} />
        ) : (
          <CreateForm onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SharedFields() {
  const { control } = useFormContext()

  return (
    <>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input {...field} id="name" placeholder="My Project" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <FieldSeparator>Database</FieldSeparator>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="db_type"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="db-type">DB Type</FieldLabel>
              <Input {...field} id="db-type" placeholder="postgresql" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="db_port"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="db-port">DB Port</FieldLabel>
              <Input
                {...field}
                onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                id="db-port"
                type="number"
                placeholder="5432"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="db_host"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="db-host">DB Host</FieldLabel>
            <Input {...field} id="db-host" placeholder="localhost" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="db_name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="db-name">DB Name</FieldLabel>
              <Input {...field} id="db-name" placeholder="mydb" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="db_username"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="db-username">DB Username</FieldLabel>
              <Input {...field} id="db-username" placeholder="postgres" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <FieldSeparator>API</FieldSeparator>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="api_endpoint"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="api-endpoint">API Endpoint</FieldLabel>
              <Input {...field} value={field.value ?? ''} id="api-endpoint" placeholder="https://..." aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="api_login"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="api-login">API Login</FieldLabel>
              <Input {...field} value={field.value ?? ''} id="api-login" placeholder="admin" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <FieldSeparator>S3 Storage</FieldSeparator>

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="s3_bucket_name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="s3-bucket">Bucket Name</FieldLabel>
              <Input {...field} value={field.value ?? ''} id="s3-bucket" placeholder="my-bucket" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="s3_region"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="s3-region">Region</FieldLabel>
              <Input {...field} value={field.value ?? ''} id="s3-region" placeholder="us-east-1" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="s3_access_key_id"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="s3-access-key">Access Key ID</FieldLabel>
            <Input {...field} value={field.value ?? ''} id="s3-access-key" placeholder="AKIA..." aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <FieldSeparator>Advanced</FieldSeparator>

      <Controller
        name="extra_columns"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="extra-columns">Extra Columns</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ''}
              id="extra-columns"
              placeholder="column1,column2"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="price_field"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="price-field">Price Field</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id="price-field"
                placeholder="price"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="markup_id_trigger"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="markup-trigger">Markup ID Trigger</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id="markup-trigger"
                placeholder="markup_id"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="parent_category"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="parent-category">Parent Category</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ''}
              id="parent-category"
              placeholder="Root TREE_ID"
              maxLength={5}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  )
}

function CreateForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      name: '',
      db_type: '',
      db_host: '',
      db_port: 5432,
      db_name: '',
      db_username: '',
      db_password: '',
      api_endpoint: '',
      api_login: '',
      api_password: '',
      extra_columns: '',
      price_field: '',
      markup_id_trigger: '',
      parent_category: '',
      s3_bucket_name: '',
      s3_region: '',
      s3_access_key_id: '',
      s3_secret_key: '',
    },
  })

  const mutation = useMutation({
    mutationFn: projectService.create,
    meta: {
      successMessage: 'Project created successfully',
      invalidatesQuery: PROJECT_QUERY_KEYS.lists(),
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    },
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
        <DialogTitle>Create Project</DialogTitle>
        <DialogDescription>Add a new project to the system.</DialogDescription>
      </DialogHeader>

      <form
        id="project-form"
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
      >
        <FieldGroup>
          <SharedFields />

          <Controller
            name="db_password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="db-password">DB Password</FieldLabel>
                <PasswordInput {...field} id="db-password" placeholder="••••••••" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="api_password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="api-password">API Password</FieldLabel>
                <PasswordInput {...field} value={field.value ?? ''} id="api-password" placeholder="••••••••" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="s3_secret_key"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="s3-secret-key">S3 Secret Key</FieldLabel>
                <PasswordInput {...field} value={field.value ?? ''} id="s3-secret-key" placeholder="••••••••" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="project-form"
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
  project,
  onOpenChange,
}: {
  project: Project
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<UpdateProjectFormValues>({
    resolver: zodResolver(UpdateProjectSchema),
    defaultValues: {
      name: project.name,
      db_type: project.db_type,
      db_host: project.db_host,
      db_port: project.db_port ?? 5432,
      db_name: project.db_name ?? '',
      db_username: project.db_username ?? '',
      api_endpoint: project.api_endpoint ?? '',
      api_login: project.api_login ?? '',
      extra_columns: project.extra_columns ?? '',
      price_field: project.price_field ?? '',
      markup_id_trigger: project.markup_id_trigger ?? '',
      parent_category: project.parent_category ?? '',
      s3_bucket_name: project.s3_bucket_name ?? '',
      s3_region: project.s3_region ?? '',
      s3_access_key_id: project.s3_access_key_id ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: projectService.update,
    meta: {
      successMessage: 'Project updated successfully',
      invalidatesQuery: PROJECT_QUERY_KEYS.lists(),
    },
    onSuccess: () => onOpenChange(false),
  })

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({ id: project.id, payload: data })
  })

  return (
    <FormProvider {...form}>
      <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
        <DialogTitle>Edit Project</DialogTitle>
        <DialogDescription>
          Update configuration for {project.name}.
        </DialogDescription>
      </DialogHeader>

      <form
        id="project-form"
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-4"
      >
        <FieldGroup>
          <SharedFields />
        </FieldGroup>
      </form>

      <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="project-form"
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}
