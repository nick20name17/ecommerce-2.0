import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ManagingTasks() {
  return (
    <Article
      title="Managing Tasks"
      subtitle="Update statuses, add notes, and keep task details current."
    >
      <h2>Changing Status</h2>
      <p>
        Task status can be updated in several ways. In the <strong>Kanban board</strong>, drag a
        task card from one column to another to change its status instantly. In the
        <strong> list view</strong>, click the status badge on any row to open a dropdown with
        all available statuses. On the task detail page, use the status control in the header to
        make changes.
      </p>

      <VideoSlot
        title="Managing tasks"
        description="See how to drag tasks on the Kanban board and edit task details."
      />

      <h2>Notes and Attachments</h2>
      <p>
        Open a task to add notes that provide context or record progress updates. Notes support
        plain text and are visible to anyone who can view the task. Use notes to capture meeting
        outcomes, customer feedback, or any information the assignee needs to complete the work.
      </p>
      <p>
        File attachments can be added to tasks for supporting documents, images, or
        spreadsheets. Drag files into the task detail page or use the attachment button to browse
        your computer.
      </p>

      <h2>Editing Task Details</h2>
      <p>
        All task fields are editable from the detail page. Click any field to modify it inline:
      </p>
      <ul>
        <li><strong>Title</strong> — click to rename the task.</li>
        <li><strong>Assignee</strong> — reassign to a different team member.</li>
        <li><strong>Priority</strong> — escalate or de-escalate as needed.</li>
        <li><strong>Due date</strong> — push out or pull in the deadline.</li>
        <li><strong>Linked entity</strong> — change or add a link to an order, proposal, or customer.</li>
      </ul>

      <Callout type="info">
        <p>
          Changes to tasks are saved automatically and reflected immediately for all users.
          There is no save button required.
        </p>
      </Callout>

      <Callout type="tip">
        <p>
          Use status changes combined with assignee updates to hand off tasks between team
          members during multi-step workflows.
        </p>
      </Callout>
    </Article>
  )
}
