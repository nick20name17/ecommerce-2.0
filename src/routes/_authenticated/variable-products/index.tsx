import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/variable-products/')({
  beforeLoad: () => {
    throw redirect({ to: '/catalog' })
  },
  component: () => null,
})
