import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { CustomerSchema, type CustomerFormValues, type Customer } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CUSTOMER_TYPE_OPTIONS } from '@/constants/customer'

interface CustomerModalProps {
  customer?: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CustomerModal = ({ customer, open, onOpenChange }: CustomerModalProps) => {
  const isEdit = !!customer

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        {isEdit ? (
          <EditForm customer={customer} onOpenChange={onOpenChange} />
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
        name='l_name'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='l-name'>Name</FieldLabel>
            <Input {...field} id='l-name' placeholder='Company or customer name' aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className='grid grid-cols-2 gap-4'>
        <Controller
          name='contact_1'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='contact-1'>Phone</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='contact-1' placeholder='(555) 123-4567' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='contact_3'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='contact-3'>Email</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='contact-3' type='email' placeholder='email@example.com' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name='address1'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='address1'>Address Line 1</FieldLabel>
            <Input {...field} value={field.value ?? ''} id='address1' placeholder='123 Main St' />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name='address2'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='address2'>Address Line 2</FieldLabel>
            <Input {...field} value={field.value ?? ''} id='address2' placeholder='Suite 100' />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className='grid grid-cols-3 gap-4'>
        <Controller
          name='city'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='city'>City</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='city' placeholder='City' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='state'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='state'>State</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='state' placeholder='CA' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='zip'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='zip'>ZIP</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='zip' placeholder='90210' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <Controller
          name='country'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='country'>Country</FieldLabel>
              <Input {...field} value={field.value ?? ''} id='country' placeholder='US' />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name='in_level'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Customer Type</FieldLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
              >
                <SelectTrigger className='w-full' aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPE_OPTIONS.map(({ value, label }) => (
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
      </div>
    </>
  )
}

function CreateForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      l_name: '',
      contact_1: '',
      contact_3: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      in_level: '',
      inactive: false,
    },
  })

  const mutation = useMutation({
    mutationFn: customerService.create,
    meta: {
      successMessage: 'Customer created successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.lists(),
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    },
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader>
        <DialogTitle>Create Customer</DialogTitle>
        <DialogDescription>Add a new customer.</DialogDescription>
      </DialogHeader>

      <form id='customer-form' onSubmit={handleSubmit}>
        <FieldGroup>
          <SharedFields />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type='submit'
          form='customer-form'
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
  customer,
  onOpenChange,
}: {
  customer: Customer
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      l_name: customer.l_name,
      contact_1: customer.contact_1 ?? '',
      contact_3: customer.contact_3 ?? '',
      address1: customer.address1 ?? '',
      address2: customer.address2 ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      zip: customer.zip ?? '',
      country: customer.country ?? '',
      in_level: customer.in_level ?? '',
      inactive: customer.inactive ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CustomerFormValues) => customerService.update(customer.id, data),
    meta: {
      successMessage: 'Customer updated successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.lists(),
    },
    onSuccess: () => onOpenChange(false),
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogDescription>
          Update customer {customer.l_name}.
        </DialogDescription>
      </DialogHeader>

      <form id='customer-form' onSubmit={handleSubmit}>
        <FieldGroup>
          <SharedFields />

          <Controller
            name='inactive'
            control={form.control}
            render={({ field }) => (
              <Field orientation='horizontal'>
                <Checkbox
                  id='inactive'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor='inactive'>Inactive</FieldLabel>
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <DialogFooter>
        <Button variant='outline' onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          type='submit'
          form='customer-form'
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}
