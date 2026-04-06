import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function TasksOverview() {
  return (
    <Article
      title="Tasks Overview"
      subtitle="Track work items across your team with list and Kanban views."
    >
      <h2>List View and Kanban Board</h2>
      <p>
        Tasks can be viewed in two layouts. The <strong>list view</strong> presents tasks in a
        sortable, filterable table where each row shows the task title, status, priority,
        assignee, due date, and any linked records. The <strong>Kanban board</strong> organizes
        tasks into columns by status, letting you see workflow progress at a glance and move
        tasks between stages by dragging and dropping.
      </p>

      <VideoSlot
        title="Tasks list and Kanban views"
        description="See both task views in action and learn when to use each one."
      />

      <h2>Task Statuses and Priorities</h2>
      <p>
        Every task has a status and a priority. Statuses track where the task sits in your
        workflow:
      </p>
      <ul>
        <li><strong>Backlog</strong> — acknowledged but not yet started.</li>
        <li><strong>To Do</strong> — ready to be worked on.</li>
        <li><strong>In Progress</strong> — actively being worked on.</li>
        <li><strong>Done</strong> — completed.</li>
        <li><strong>Canceled</strong> — no longer needed.</li>
      </ul>
      <p>
        Priorities range from <strong>Urgent</strong> to <strong>No Priority</strong> and help
        your team focus on the most important work first. Priority icons appear as color-coded
        badges in both the list and Kanban views.
      </p>

      <h2>Filtering and Search</h2>
      <p>
        Use the filter bar to narrow tasks by status, priority, assignee, due date, or linked
        entity (order, proposal, or customer). The search bar matches against task titles and
        descriptions. Filters persist across sessions so your preferred view is ready when you
        return.
      </p>

      <Callout type="tip">
        <p>
          Combine the Kanban view with an assignee filter to create a personal task board that
          shows only your work.
        </p>
      </Callout>
    </Article>
  )
}
