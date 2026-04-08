import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function PickListsOverview() {
  return (
    <Article
      title="Pick Lists"
      subtitle="Real-time visibility into what's been picked but not yet shipped — functionality that doesn't exist in EBMS desktop."
    >
      <p>
        EBMS Online introduces functionality that{' '}
        <strong>doesn't exist in EBMS desktop</strong> — real-time visibility
        into what's been picked but not yet shipped.
      </p>
      <p>
        Pickers can use <strong>any device</strong> — desktop, tablet, or mobile
        — to work through their pick lists on the warehouse floor.
      </p>

      <VideoSlot
        title="Pick lists overview"
        description="Learn the purpose of pick lists and how they fit into the order lifecycle."
      />

      <h2>Why This Matters</h2>
      <p>
        In a warehouse, picking and shipping are two different stages. EBMS
        Online treats them that way:
      </p>
      <ul>
        <li>
          <strong>Picking</strong> — collecting items from the warehouse for an
          order
        </li>
        <li>
          <strong>Shipped</strong> — order has left the building
        </li>
      </ul>
      <p>
        A manager can see the live status of every pick in progress — what's
        being collected, what's ready to go, and what's still waiting. No more
        walking the floor to find out where things stand.
      </p>

      <h2>Multi-Order Picking</h2>
      <p>
        If a single customer has multiple open orders, your pickers can{' '}
        <strong>pick them all at once</strong> in a single pick list. This saves
        time, reduces trips, and keeps everything organized under one workflow.
      </p>

      <h2>What Happens After Picking</h2>
      <p>
        When a pick list is marked as complete, the data lives in EBMS Online. We
        are actively building integration to push pick status back into EBMS via
        custom fields.
      </p>

      <Callout type="info">
        The post-pick workflow can be customized to fit your business. Whether you
        need automatic status updates, notifications, or triggers for the next
        step in your process — talk to your EBMS Online team about what's
        possible.
      </Callout>
    </Article>
  )
}
