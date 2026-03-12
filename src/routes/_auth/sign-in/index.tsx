import { createFileRoute } from '@tanstack/react-router'

import { SignInForm } from './-components/sign-in-form'

const SignInPage = () => {
  return (
    <div className='flex min-h-screen items-center justify-center bg-bg-secondary/50 px-4'>
      <div className='w-full max-w-[380px]'>
        {/* Logo / brand mark */}
        <div className='mb-8 flex flex-col items-center gap-3'>
          <div className='flex size-11 items-center justify-center rounded-[10px] bg-foreground'>
            <span className='text-[18px] font-bold leading-none text-background'>E</span>
          </div>
          <div className='text-center'>
            <h1 className='text-[18px] font-semibold tracking-[-0.02em]'>Welcome back</h1>
            <p className='mt-1 text-[13px] text-text-tertiary'>
              Sign in to your account to continue
            </p>
          </div>
        </div>

        {/* Form card */}
        <SignInForm />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_auth/sign-in/')({
  component: SignInPage,
  head: () => ({
    meta: [{ title: 'Sign In' }]
  })
})
