import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/variable-products/$vpId/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: `/catalog/vp/${params.vpId}` })
  },
  component: () => null,
})
