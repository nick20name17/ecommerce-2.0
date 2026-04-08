import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function TasksOverview() {
  return (
    <Article
      title="Web Tasks"
      subtitle="Centralized task management tied directly to your EBMS records."
    >
      <Callout type="warning">
        Web Tasks are <strong>not the same as EBMS Tasks</strong>. This is a
        separate, web-based task management system built into EBMS Online. It
        does not replace or sync with the task system in EBMS desktop.
      </Callout>

      <p>
        Web Tasks is one of the highest-value features in EBMS Online — and one
        of the most underutilized. The goal is simple: because your data already
        lives in your ERP, your task management should too.
      </p>
      <p>
        Instead of tracking follow-ups in email threads, sticky notes, or
        spreadsheets, Web Tasks gives your team a centralized place to manage
        work — tied directly to the records that matter.
      </p>

      <VideoSlot
        title="Web Tasks overview"
        description="See how Web Tasks connects your task management to your EBMS records."
      />

      <h2>Why Use Web Tasks</h2>
      <p>
        Every task can be <strong>linked to an EBMS record</strong>:
      </p>
      <ul>
        <li>
          <strong>An order</strong> — track fulfillment steps, exceptions, or
          special handling
        </li>
        <li>
          <strong>A proposal</strong> — follow up on quotes, track approval
          status
        </li>
        <li>
          <strong>A customer</strong> — warranty tracking, scheduled check-ins,
          account management
        </li>
      </ul>
      <p>
        This means tasks aren't floating in a vacuum. They have context. When
        someone opens a customer or order, they see every task associated with
        it.
      </p>

      <h2>Key Benefits</h2>
      <ul>
        <li>
          <strong>Visibility</strong> — no more "I thought you were handling
          that." Tasks are visible to the whole team.
        </li>
        <li>
          <strong>Multiple assignees</strong> — assign a task to more than one
          person when work is shared
        </li>
        <li>
          <strong>Accountability</strong> — everything is tracked, timestamped,
          and tied to a record
        </li>
        <li>
          <strong>Due dates & priorities</strong> — set deadlines and priority
          levels to keep work on track
        </li>
        <li>
          <strong>Custom statuses</strong> — track tasks through your workflow
          stages
        </li>
        <li>
          <strong>Email notifications</strong> — custom email notifications can
          be configured so assignees know when tasks are created or updated
        </li>
      </ul>
    </Article>
  )
}
