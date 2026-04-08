import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function TaskBoard() {
  return (
    <Article
      title="Task Board"
      subtitle="Manage work visually with Card View and List View."
    >
      <p>
        The Task Board gives you two ways to view and manage your tasks. Switch
        between them depending on how you prefer to work.
      </p>

      <VideoSlot
        title="Task Board views"
        description="See the Card View and List View in action and learn when to use each."
      />

      <h2>Card View</h2>
      <p>
        Card View is a visual, drag-and-drop workflow. Tasks are organized into
        columns by status, and you can move them between stages by dragging. This
        is ideal for teams who want to see workflow progress at a glance and
        manage tasks interactively.
      </p>

      <h2>List View</h2>
      <p>
        List View presents tasks in a sortable, filterable table. This is best
        for scanning and filtering large numbers of tasks — especially when you
        need to find specific items or work through a backlog quickly.
      </p>

      <Callout type="tip">
        Both views are fully customizable — columns, filters, and layout can be
        tailored to fit your team's workflow.
      </Callout>
    </Article>
  )
}
