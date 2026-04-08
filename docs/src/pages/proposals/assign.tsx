import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProposalAssignAndCollaborate() {
  return (
    <Article
      title="Assign & Collaborate"
      subtitle="Use Web Tasks to coordinate work on proposals across your team."
    >
      <p>
        Proposals support the same task assignment and collaboration as orders
        through <strong>Web Tasks</strong>. Create tasks, assign team members,
        and track follow-ups — all linked to the proposal.
      </p>

      <VideoSlot
        title="Proposal collaboration with Web Tasks"
        description="See how to create and manage tasks linked to a proposal."
      />

      <Callout type="tip">
        For full details on how tasks work — including priorities, statuses, and
        the task board — see the <strong>Web Tasks</strong> section.
      </Callout>
    </Article>
  )
}
