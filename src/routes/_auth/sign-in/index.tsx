import { createFileRoute } from '@tanstack/react-router'

import { SignInForm } from './-components/sign-in-form'

const SignInPage = () => {
  return (
    <section className='flex h-screen items-center justify-center'>
      <SignInForm />
    </section>
  )
}

export const Route = createFileRoute('/_auth/sign-in/')({
  component: SignInPage,
  head: () => {
    return {
      meta: [
        {
          title: 'Sign In'
        }
      ]
    }
  }
})
