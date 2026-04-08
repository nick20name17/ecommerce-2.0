import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ConvertingProposals() {
  return (
    <Article
      title="Converting to Orders"
      subtitle="Turn an approved proposal into a live order — one of the most powerful features in EBMS Online."
    >
      <p>
        One of the most powerful features in EBMS Online is the ability to{' '}
        <strong>convert a proposal into a sales order</strong>.
      </p>

      <VideoSlot
        title="Converting a proposal to an order"
        description="See the one-click conversion flow in action."
      />

      <h2>How It Works</h2>
      <p>
        A proposal can be created at any time — on the road, in a meeting, or
        from the office. When the proposal is ready to move forward, it can be
        converted directly into an order. The conversion is handled through EBMS
        — the proposal is replaced by a sales order. This is an all-or-nothing
        action; partial conversions are not supported.
      </p>

      <h2>When to Use This</h2>
      <p>
        This feature is built for workflows where proposals need{' '}
        <strong>review before becoming orders</strong>:
      </p>
      <ul>
        <li>
          <strong>Sales reps on the road</strong> — create proposals on-site with
          a customer, submit them back to the office for review, and the office
          converts approved proposals into orders
        </li>
        <li>
          <strong>Approval workflows</strong> — any time a quote or estimate
          needs sign-off before it becomes a committed order
        </li>
        <li>
          <strong>Separation of duties</strong> — let field teams sell and office
          teams process, with a clean handoff point
        </li>
      </ul>

      <h2>Why It Matters</h2>
      <p>
        Converting proposals to orders keeps your pipeline visible and your data
        clean. Every order has a traceable origin — you know who created the
        proposal and when it was approved.
      </p>

      <Callout type="warning">
        Conversion is a one-way action. Once a proposal has been converted, it
        cannot be reverted back to an open proposal. Make sure the customer has
        fully approved before proceeding.
      </Callout>
    </Article>
  )
}
