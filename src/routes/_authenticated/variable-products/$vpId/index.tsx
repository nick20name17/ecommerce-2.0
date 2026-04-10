import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

const VPRedirect = () => {
  const { vpId } = useParams({ strict: false }) as { vpId: string }
  const navigate = useNavigate()

  useEffect(() => {
    navigate({ to: '/catalog' })
  }, [navigate, vpId])

  return null
}

export const Route = createFileRoute('/_authenticated/variable-products/$vpId/')({
  component: VPRedirect,
})
