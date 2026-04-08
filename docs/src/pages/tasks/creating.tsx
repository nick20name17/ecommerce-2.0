import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'
import { Kbd } from '@/components/kbd'

export function CreatingTasks() {
  return (
    <Article
      title="Creating Tasks"
      subtitle="Create a task from anywhere in EBMS Online — from an order, a proposal, a customer record, or the task board itself."
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

      <h2>What a Task Includes</h2>
      <p>Each task can include:</p>
      <ul>
        <li>A description</li>
        <li>One or more assignees</li>
        <li>A linked record (order, proposal, or customer)</li>
        <li>A due date</li>
        <li>A priority level</li>
      </ul>

      <Callout type="tip">
        You can also create tasks directly from a customer, order, or proposal
        detail page. The link to that entity is set automatically.
      </Callout>
    </Article>
  )
}
