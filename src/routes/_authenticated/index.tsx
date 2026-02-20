import { createFileRoute } from '@tanstack/react-router'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/providers/auth'

const DashboardPage = () => {
  const { user, isUserLoading } = useAuth()

  if (isUserLoading) return <Spinner />

  return <pre>{JSON.stringify(user, null, 2)}</pre>
}

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: 'Dashboard' }]
  })
})
