import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProposalsOverview() {
  return (
    <Article
      title="Proposals Overview"
      subtitle="Create and manage quotes before they become orders."
    >
      <h2>What Are Proposals?</h2>
      <p>
        Proposals are preliminary quotes you create for customers before committing to a full order.
        They let you build out line items, apply pricing, and share a summary with the customer
        without affecting inventory or triggering fulfillment workflows. Once a customer approves,
        you can convert the proposal into an order with a single click.
      </p>

      <h2>List View</h2>
      <p>
        The proposals list displays all proposals across your team. Each row shows the proposal
        number, customer name, total amount, assigned sales rep, and current status. You can sort
        by any column, search by proposal number or customer name, and apply filters to narrow
        results by status, date range, or assignee.
      </p>

      <VideoSlot
        title="Proposals list walkthrough"
        description="See how to browse, filter, and search proposals in the list view."
      />

      <h2>Proposal Statuses</h2>
      <p>
        Every proposal moves through a defined set of statuses that reflect where it sits in the
        sales cycle:
      </p>
      <ul>
        <li><strong>Open</strong> — newly created and awaiting customer review.</li>
        <li><strong>Accepted</strong> — the customer has approved the quote.</li>
        <li><strong>Rejected</strong> — the customer declined the proposal.</li>
        <li><strong>Converted</strong> — the proposal has been turned into an order.</li>
      </ul>

      <Callout type="info">
        <p>
          Converted proposals remain in the list for reference but are read-only. You can always
          navigate to the resulting order from the proposal detail page.
        </p>
      </Callout>

      <h2>Converting to Orders</h2>
      <p>
        When a customer accepts a proposal, open the proposal detail and click
        <strong> Convert to Order</strong>. EBMS copies all line items, pricing, and customer
        details into a new order. The original proposal is marked as Converted and linked to
        the new order for traceability.
      </p>
    </Article>
  )
}
