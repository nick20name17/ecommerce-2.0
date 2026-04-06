import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ConvertingProposals() {
  return (
    <Article
      title="Converting to Orders"
      subtitle="Turn an approved proposal into a live order with one click."
    >
      <h2>When to Convert</h2>
      <p>
        Once your customer has reviewed and approved a proposal, you can convert it into a full
        order. Conversion copies all line items, pricing, and customer information into a new
        order record that enters the standard order lifecycle. This is the bridge between quoting
        and fulfillment.
      </p>

      <h2>How to Convert</h2>
      <Steps>
        <Step number={1} title="Open the proposal">
          <p>
            Navigate to the proposal detail page by clicking the proposal row in the list view.
          </p>
        </Step>
        <Step number={2} title="Click Convert to Order">
          <p>
            In the proposal header, click the <strong>Convert to Order</strong> button. A
            confirmation dialog appears showing the line items and totals that will be carried
            over.
          </p>
        </Step>
        <Step number={3} title="Confirm the conversion">
          <p>
            Review the summary and click <strong>Confirm</strong>. EBMS creates the new order
            and redirects you to the order detail page automatically.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Converting a proposal to an order"
        description="See the one-click conversion flow in action."
      />

      <h2>What Happens to the Original Proposal</h2>
      <p>
        After conversion, the original proposal is updated with a <strong>Converted</strong> status.
        It becomes read-only and displays a link to the newly created order. All line items and
        pricing remain visible for reference, but they cannot be edited.
      </p>

      <Callout type="info">
        <p>
          The proposal and its resulting order share the same line item data. If you need to make
          changes after conversion, edit the order directly. Changes to the order do not flow
          back to the proposal.
        </p>
      </Callout>

      <Callout type="warning">
        <p>
          Conversion is a one-way action. Once a proposal has been converted, it cannot be
          reverted back to an open proposal. Make sure the customer has fully approved before
          proceeding.
        </p>
      </Callout>
    </Article>
  )
}
