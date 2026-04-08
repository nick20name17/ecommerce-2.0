import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function WidgetsAndMetrics() {
  return (
    <Article
      title="Widgets & Metrics"
      subtitle="Understand the card-based dashboard system and how to customize your view."
    >
      <p>
        The EBMS Online dashboard is built around <strong>cards</strong> — each
        card displays a widget, metric, or graph tailored to your business needs.
      </p>

      <VideoSlot
        title="Widgets & Metrics overview"
        description="See how dashboard cards work and how to customize your view."
      />

      <h2>What's in a Card</h2>
      <p>Each dashboard card can contain:</p>
      <ul>
        <li>
          <strong>Widgets</strong> — interactive components (e.g., quick-action
          buttons, status summaries)
        </li>
        <li>
          <strong>Metrics</strong> — key numbers at a glance (e.g., open orders,
          revenue today)
        </li>
        <li>
          <strong>Graphs</strong> — visual data representations (bar charts, line
          charts, etc.)
        </li>
      </ul>

      <h2>Standard vs. Custom</h2>
      <p>
        EBMS Online ships with a library of <strong>standard widgets</strong> you
        can choose from and add to your dashboard. Beyond that, custom graphs and
        widgets can be built to match your specific reporting needs — talk to your
        EBMS Online team about what's possible.
      </p>

      <h2>Visibility & Permissions</h2>
      <p>Widgets support two visibility levels:</p>
      <ul>
        <li>
          <strong>All Users</strong> — available to everyone in the system.
        </li>
        <li>
          <strong>Role-Restricted</strong> — available only to specific user
          roles.
        </li>
      </ul>
      <p>
        Users can <strong>customize their own dashboard</strong> from the widgets
        they have permission to see. If you have access to finance cards, you can
        choose to show or hide them. If you don't have permission, they won't
        appear as an option at all.
      </p>

      <Callout type="tip">
        Each user builds the dashboard that works best for them — while admins
        control the boundaries of what's available.
      </Callout>
    </Article>
  )
}
