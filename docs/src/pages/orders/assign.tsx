import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function OrderAssignAndCollaborate() {
  return (
    <Article
      title="Assign & Collaborate"
      subtitle="Use Web Tasks to coordinate work on orders across your team."
    >
      <p>
        Orders support task assignment and collaboration through{' '}
        <strong>Web Tasks</strong>. You can create tasks directly from an order,
        assign them to team members, and track progress — all linked back to the
        order record.
      </p>

      <VideoSlot
        title="Order collaboration with Web Tasks"
        description="See how to create and manage tasks linked to an order."
      />

      <h2>How It Works</h2>
      <p>
        From any order detail page, create a new task and it's automatically
        linked to that order. Assigned team members can see the task on their
        task board, and anyone viewing the order can see all associated tasks.
      </p>

      <Callout type="tip">
        For full details on how tasks work — including priorities, statuses, and
        the task board — see the <strong>Web Tasks</strong> section.
      </Callout>
    </Article>
  )
}
