import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'
import { Kbd } from '@/components/kbd'

export function CreatingTasks() {
  return (
    <Article
      title="Creating Tasks"
      subtitle="Create tasks from the command bar or any linked entity page."
    >
      <h2>Using the Command Bar</h2>
      <p>
        The fastest way to create a task is through the command bar. Press{' '}
        <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> from anywhere in the application to open it, then
        select <strong>Create Task</strong>. The command bar provides a streamlined form where
        you can set the title, assignee, priority, and due date in one quick interaction.
      </p>

      <Steps>
        <Step number={1} title="Open the command bar">
          <p>
            Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> to open the command bar overlay.
          </p>
        </Step>
        <Step number={2} title="Select Create Task">
          <p>
            Type "task" or browse the available actions and select <strong>Create Task</strong>.
          </p>
        </Step>
        <Step number={3} title="Fill in task details">
          <p>
            Enter a descriptive title for the task. Optionally set the priority, assignee, and
            due date using the form controls.
          </p>
        </Step>
        <Step number={4} title="Link to a record (optional)">
          <p>
            Link the task to an order, proposal, or customer. Linked tasks appear on the related
            entity's tasks tab for easy reference.
          </p>
        </Step>
        <Step number={5} title="Save">
          <p>
            Click <strong>Create</strong> or press <Kbd>Enter</Kbd> to save the task. It
            appears immediately in the task list and Kanban board.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Creating a task"
        description="Watch how to create and link a task using the command bar."
      />

      <h2>Setting Priority and Assignee</h2>
      <p>
        Choose a priority level from Urgent, High, Medium, Low, or No Priority. Assign the task
        to a team member so it appears on their personal board. Both fields can be updated after
        creation if plans change.
      </p>

      <h2>Due Dates</h2>
      <p>
        Set a due date to keep the task on track. Tasks with passed due dates are highlighted in
        the list and board views so overdue work is immediately visible to the team.
      </p>

      <Callout type="tip">
        <p>
          You can also create tasks directly from a customer, order, or proposal detail page. The
          link to that entity is set automatically.
        </p>
      </Callout>
    </Article>
  )
}
