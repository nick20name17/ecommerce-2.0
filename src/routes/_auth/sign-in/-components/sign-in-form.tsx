import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LogIn, Mail } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { type SignInPayload, SignInPayloadSchema } from '@/api/auth/schema'
import { cn } from '@/lib/utils'
import { useAuth } from '@/providers/auth'

export const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false)

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
    <div className='rounded-[12px] border border-border bg-background p-6 shadow-sm'>
      <form onSubmit={handleSignIn} className='space-y-4'>
        {/* Email field */}
        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <div className='space-y-1.5'>
              <label
                htmlFor='email'
                className='block text-[13px] font-medium text-text-secondary'
              >
                Email
              </label>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-[8px] border bg-background px-3 py-2 transition-colors duration-[80ms] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
                  fieldState.invalid
                    ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20'
                    : 'border-border'
                )}
              >
                <Mail className='size-4 shrink-0 text-text-quaternary' />
                <input
                  {...field}
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  autoComplete='email'
                  className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-quaternary'
                />
              </div>
              {fieldState.error && (
                <p className='text-[12px] text-destructive'>{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        {/* Password field */}
        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <div className='space-y-1.5'>
              <label
                htmlFor='password'
                className='block text-[13px] font-medium text-text-secondary'
              >
                Password
              </label>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-[8px] border bg-background px-3 py-2 transition-colors duration-[80ms] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
                  fieldState.invalid
                    ? 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20'
                    : 'border-border'
                )}
              >
                <input
                  {...field}
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  autoComplete='current-password'
                  className='flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-quaternary'
                />
                <button
                  type='button'
                  className='inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] text-text-quaternary transition-colors hover:text-text-secondary'
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className='size-3.5' />
                  ) : (
                    <Eye className='size-3.5' />
                  )}
                </button>
              </div>
              {fieldState.error && (
                <p className='text-[12px] text-destructive'>{fieldState.error.message}</p>
              )}
            </div>
          )}
        />

        {/* Submit */}
        <button
          type='submit'
          disabled={signInMutation.isPending}
          className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity duration-[80ms] hover:opacity-90 disabled:pointer-events-none disabled:opacity-50'
        >
          {signInMutation.isPending ? (
            <>
              <Loader2 className='size-3.5 animate-spin' />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className='size-3.5' />
              Sign In
            </>
          )}
        </button>
      </form>
    </div>
  )
}
