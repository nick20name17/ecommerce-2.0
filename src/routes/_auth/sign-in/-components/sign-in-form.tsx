import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { type SignInPayload, SignInPayloadSchema } from '@/api/auth/schema'
import { PasswordInput } from '@/components/common/inputs/password-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth'

export const SignInForm = () => {
  const form = useForm<SignInPayload>({
    resolver: zodResolver(SignInPayloadSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const { signInMutation } = useAuth()

  const handleSignIn = form.handleSubmit((data) => {
    signInMutation.mutate(data)
  })

  return (
    <Card className='w-72 sm:w-100'>
      <CardHeader>
        <CardTitle>
          <h1 className='text-primary text-center text-xl leading-none font-bold md:text-3xl'>
            Sign In
          </h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id='sign-in-form'
          onSubmit={handleSignIn}
        >
          <FieldGroup>
            <Controller
              name='email'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='email'>Email</FieldLabel>
                  <Input
                    {...field}
                    id='email'
                    aria-invalid={fieldState.invalid}
                    placeholder='example@example.com'
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name='password'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
                  <PasswordInput
                    id='password'
                    {...field}
                  />

                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <FieldGroup>
          <Field>
            <Button
              isPending={signInMutation.isPending}
              disabled={signInMutation.isPending}
              className='w-full'
              type='submit'
              form='sign-in-form'
            >
              Sign In
            </Button>
          </Field>
        </FieldGroup>
      </CardFooter>
    </Card>
  )
}
