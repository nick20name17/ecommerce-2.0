import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { PICK_LIST_QUERY_KEYS } from '@/api/pick-list/query'
import { type CreatePickListFormValues, CreatePickListSchema } from '@/api/pick-list/schema'
import { pickListService } from '@/api/pick-list/service'
import { getShippingAddressesQuery } from '@/api/shipping-address/query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useProjectId } from '@/hooks/use-project-id'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePickListModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate()
  const [projectId] = useProjectId()

  const { data: shippingAddresses } = useQuery({
    ...getShippingAddressesQuery(projectId),
    enabled: open,
  })
  const defaultShippingAddressId = useMemo(() => {
    const list = Array.isArray(shippingAddresses) ? shippingAddresses : []
    const def = list.find((a) => a.is_default) ?? list[0]
    return def?.id ?? null
  }, [shippingAddresses])

  const form = useForm<CreatePickListFormValues>({
    resolver: zodResolver(CreatePickListSchema),
    defaultValues: {
      name: '',
      notes: '',
      ship_to: {
        name: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postal: '',
        country: 'US',
      },
    },
  })

  const { control, handleSubmit, reset } = form

  const mutation = useMutation({
    mutationFn: pickListService.create,
    meta: {
      successMessage: 'Pick list created',
      invalidatesQuery: PICK_LIST_QUERY_KEYS.lists(),
    },
    onSuccess: (pickList) => {
      onOpenChange(false)
      reset()
      navigate({ to: '/pick-lists/$pickListId', params: { pickListId: String(pickList.id) } })
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (!defaultShippingAddressId) {
      return
    }
    mutation.mutate({
      ship_to: values.ship_to,
      shipping_address_id: defaultShippingAddressId,
      name: values.name || undefined,
      notes: values.notes || undefined,
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]'>
        <DialogHeader className='border-b border-border px-5 py-3'>
          <DialogTitle className='text-[14px]'>New Pick List</DialogTitle>
        </DialogHeader>

        <DialogBody className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>
          <form id='create-pick-list' onSubmit={onSubmit} className='flex flex-col gap-4'>
            {/* Optional name & notes */}
            <div className='grid grid-cols-2 gap-3'>
              <Controller
                name='name'
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='pick-list-name'>Name (optional)</FieldLabel>
                    <Input {...field} id='pick-list-name' placeholder='Batch #1' />
                  </Field>
                )}
              />
              <Controller
                name='notes'
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='pick-list-notes'>Notes (optional)</FieldLabel>
                    <Input {...field} id='pick-list-notes' placeholder='Rush order' />
                  </Field>
                )}
              />
            </div>

            {/* Ship-to section */}
            <div className='border-t border-border pt-4'>
              <p className='mb-3 text-[13px] font-semibold text-foreground'>Ship To</p>

              <div className='flex flex-col gap-3'>
                <div className='grid grid-cols-2 gap-3'>
                  <Controller
                    name='ship_to.name'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='ship-to-name'>Name *</FieldLabel>
                        <Input {...field} id='ship-to-name' placeholder='John Smith' aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name='ship_to.phone'
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor='ship-to-phone'>Phone</FieldLabel>
                        <Input {...field} id='ship-to-phone' placeholder='555-1234' />
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name='ship_to.address1'
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='ship-to-address1'>Address 1 *</FieldLabel>
                      <Input {...field} id='ship-to-address1' placeholder='123 Main St' aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name='ship_to.address2'
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor='ship-to-address2'>Address 2</FieldLabel>
                      <Input {...field} id='ship-to-address2' placeholder='Suite 100' />
                    </Field>
                  )}
                />

                <div className='grid grid-cols-3 gap-3'>
                  <Controller
                    name='ship_to.city'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='ship-to-city'>City *</FieldLabel>
                        <Input {...field} id='ship-to-city' placeholder='Toronto' aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name='ship_to.state'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='ship-to-state'>State *</FieldLabel>
                        <Input {...field} id='ship-to-state' placeholder='ON' aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name='ship_to.postal'
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor='ship-to-postal'>Postal *</FieldLabel>
                        <Input {...field} id='ship-to-postal' placeholder='M5V1A1' aria-invalid={fieldState.invalid} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name='ship_to.country'
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='ship-to-country'>Country *</FieldLabel>
                      <Input {...field} id='ship-to-country' placeholder='CA' aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </div>
          </form>
        </DialogBody>

        <DialogFooter className='border-t border-border px-5 py-3'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='create-pick-list' isPending={mutation.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
