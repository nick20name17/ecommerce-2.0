import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { SHIPPING_ADDRESS_QUERY_KEYS } from '@/api/shipping-address/query'
import {
  ShippingAddressSchema,
  type ShippingAddress,
  type ShippingAddressFormValues,
} from '@/api/shipping-address/schema'
import { shippingAddressService } from '@/api/shipping-address/service'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ShippingAddressModalProps {
  address?: ShippingAddress | null
  projectId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShippingAddressModal = ({
  address,
  projectId,
  open,
  onOpenChange,
}: ShippingAddressModalProps) => {
  const isEdit = !!address

  const form = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: {
      title: address?.title ?? '',
      name: address?.name ?? '',
      company_name: address?.company_name ?? '',
      phone: address?.phone ?? '',
      address_line1: address?.address_line1 ?? '',
      address_line2: address?.address_line2 ?? '',
      city: address?.city ?? '',
      state: address?.state ?? '',
      postal_code: address?.postal_code ?? '',
      country_code: address?.country_code ?? '',
      is_default: address?.is_default ?? false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ShippingAddressFormValues) =>
      isEdit
        ? shippingAddressService.update(address.id, data, projectId)
        : shippingAddressService.create(data as any, projectId),
    meta: {
      successMessage: isEdit ? 'Address updated' : 'Address created',
      invalidatesQuery: SHIPPING_ADDRESS_QUERY_KEYS.all(),
    },
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    },
  })

  const handleSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-md'>
        <DialogHeader className='sticky top-0 z-10 border-b bg-background px-6 py-4'>
          <DialogTitle>{isEdit ? 'Edit Address' : 'Add Address'}</DialogTitle>
        </DialogHeader>

        <DialogBody className='px-6 py-4'>
          <form id='shipping-address-form' onSubmit={handleSubmit}>
            <FieldGroup>
              <Controller
                name='title'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sa-title'>Label</FieldLabel>
                    <Input {...field} id='sa-title' placeholder='e.g. Warehouse, Head Office' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='name'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-name'>Contact Name</FieldLabel>
                      <Input {...field} id='sa-name' placeholder='John Doe' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name='company_name'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-company'>Company</FieldLabel>
                      <Input {...field} id='sa-company' placeholder='Acme Inc.' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name='phone'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sa-phone'>Phone</FieldLabel>
                    <Input {...field} id='sa-phone' placeholder='+1 555 123 4567' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='address_line1'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sa-addr1'>Address Line 1</FieldLabel>
                    <Input {...field} id='sa-addr1' placeholder='123 Main St' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name='address_line2'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='sa-addr2'>Address Line 2</FieldLabel>
                    <Input {...field} id='sa-addr2' placeholder='Suite 100' />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='city'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-city'>City</FieldLabel>
                      <Input {...field} id='sa-city' placeholder='New York' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name='state'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-state'>State / Province</FieldLabel>
                      <Input {...field} id='sa-state' placeholder='NY' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <Controller
                  name='postal_code'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-zip'>Postal Code</FieldLabel>
                      <Input {...field} id='sa-zip' placeholder='10001' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name='country_code'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='sa-country'>Country Code</FieldLabel>
                      <Input {...field} id='sa-country' placeholder='US' maxLength={2} className='uppercase' />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name='is_default'
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal'>
                    <Checkbox
                      id='sa-default'
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor='sa-default'>Default address</FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </DialogBody>

        <DialogFooter className='sticky bottom-0 z-10 border-t bg-background px-6 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='shipping-address-form'
            isPending={mutation.isPending}
            disabled={mutation.isPending}
          >
            {isEdit ? 'Save Changes' : 'Add Address'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
