import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'

import { CUSTOMER_QUERY_KEYS } from '@/api/customer/query'
import { type Customer, type CustomerFormValues, CustomerSchema } from '@/api/customer/schema'
import { customerService } from '@/api/customer/service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CUSTOMER_TYPE_OPTIONS, getCustomerTypeLabel } from '@/constants/customer'

interface CustomerModalProps {
  customer?: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CustomerModal = ({ customer, open, onOpenChange }: CustomerModalProps) => {
  const isEdit = !!customer

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md'>
        {isEdit ? (
          <EditForm
            customer={customer}
            onOpenChange={onOpenChange}
          />
        ) : (
          <CreateForm onOpenChange={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Shared Fields ───────────────────────────────────────────

const SharedFields = () => {
  const { control } = useFormContext()

  return (
    <div className='space-y-3'>
      <Controller
        name='l_name'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='l-name'>Name</FieldLabel>
            <Input
              {...field}
              id='l-name'
              placeholder='Company or customer name'
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className='grid grid-cols-2 gap-3'>
        <Controller
          name='in_level'
          control={control}
          render={({ field, fieldState }) => {
            const currentValue = field.value ? String(field.value) : ''
            const hasUnknownValue = currentValue && !CUSTOMER_TYPE_OPTIONS.some(o => o.value === currentValue)
            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Type</FieldLabel>
                <Select
                  value={currentValue || undefined}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    className='w-full'
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMER_TYPE_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                    {hasUnknownValue && (
                      <SelectItem value={currentValue}>
                        {getCustomerTypeLabel(currentValue)}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )
          }}
        />
        <Controller
          name='country'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='country'>Country</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id='country'
                placeholder='US'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className='border-t border-border-light' />

      <div className='grid grid-cols-2 gap-3'>
        <Controller
          name='contact_1'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='contact-1'>Phone</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id='contact-1'
                placeholder='(555) 123-4567'
              />
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
              <Input
                {...field}
                value={field.value ?? ''}
                id='contact-3'
                type='email'
                placeholder='email@example.com'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className='border-t border-border-light' />

      <Controller
        name='address1'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='address1'>Street</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ''}
              id='address1'
              placeholder='123 Main St'
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name='address2'
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor='address2'>Apt / Suite</FieldLabel>
            <Input
              {...field}
              value={field.value ?? ''}
              id='address2'
              placeholder='Suite 100'
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className='grid grid-cols-3 gap-3'>
        <Controller
          name='city'
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='city'>City</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ''}
                id='city'
                placeholder='City'
              />
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
              <Input
                {...field}
                value={field.value ?? ''}
                id='state'
                placeholder='CA'
              />
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
              <Input
                {...field}
                value={field.value ?? ''}
                id='zip'
                placeholder='90210'
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  )
}

// ── Create Form ─────────────────────────────────────────────

const CreateForm = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
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
      inactive: false
    }
  })

  const mutation = useMutation({
    mutationFn: customerService.create,
    meta: {
      successMessage: 'Customer created successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.lists()
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    }
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader className='sticky top-0 z-10 border-b bg-background px-5 py-3.5'>
        <DialogTitle className='text-[14px]'>New Customer</DialogTitle>
      </DialogHeader>

      <DialogBody className='overflow-y-auto px-5 py-4'>
        <form
          id='customer-form'
          onSubmit={handleSubmit}
        >
          <SharedFields />
        </form>
      </DialogBody>

      <DialogFooter className='sticky bottom-0 z-10 border-t bg-background px-5 py-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='customer-form'
          size='sm'
          isPending={mutation.isPending}
          disabled={mutation.isPending}
        >
          Create
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}

// ── Edit Form ───────────────────────────────────────────────

const EditForm = ({
  customer,
  onOpenChange
}: {
  customer: Customer
  onOpenChange: (open: boolean) => void
}) => {
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
      in_level: customer.in_level != null ? String(customer.in_level) : '',
      inactive: customer.inactive ?? false
    }
  })

  const mutation = useMutation({
    mutationFn: (data: CustomerFormValues) => customerService.update(customer.id, data),
    meta: {
      successMessage: 'Customer updated successfully',
      invalidatesQuery: CUSTOMER_QUERY_KEYS.lists()
    },
    onSuccess: () => onOpenChange(false)
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <FormProvider {...form}>
      <DialogHeader className='sticky top-0 z-10 border-b bg-background px-5 py-3.5'>
        <DialogTitle className='text-[14px]'>Edit Customer</DialogTitle>
      </DialogHeader>

      <DialogBody className='overflow-y-auto px-5 py-4'>
        <form
          id='customer-form'
          onSubmit={handleSubmit}
        >
          <div className='space-y-3'>
            <SharedFields />

            <div className='border-t border-border-light' />

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
                  <FieldLabel htmlFor='inactive'>Mark as inactive</FieldLabel>
                </Field>
              )}
            />
          </div>
        </form>
      </DialogBody>

      <DialogFooter className='sticky bottom-0 z-10 border-t bg-background px-5 py-3'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          form='customer-form'
          size='sm'
          isPending={mutation.isPending}
          disabled={!form.formState.isDirty || mutation.isPending}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </FormProvider>
  )
}
