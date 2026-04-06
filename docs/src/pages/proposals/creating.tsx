import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function CreatingProposals() {
  return (
    <Article
      title="Creating Proposals"
      subtitle="Build a quote for your customer using the same flow as order creation."
    >
      <h2>How to Create a Proposal</h2>
      <p>
        The proposal creation flow mirrors order creation almost exactly. The key difference is
        that a proposal does not reserve inventory or trigger any downstream fulfillment. It
        exists purely as a quote until you choose to convert it.
      </p>

      <Steps>
        <Step number={1} title="Open the creation dialog">
          <p>
            Navigate to the Proposals page and click <strong>New Proposal</strong>, or use the
            command bar to start one from anywhere in the app.
          </p>
        </Step>
        <Step number={2} title="Select a customer">
          <p>
            Search for an existing customer by name or ID. The customer's default pricing and
            ship-to address will be pre-filled automatically.
          </p>
        </Step>
        <Step number={3} title="Add line items">
          <p>
            Browse the product catalog or search by item ID, UPC, or description. Set quantities
            and review unit pricing. Customer-specific price levels are applied when available.
          </p>
        </Step>
        <Step number={4} title="Review and submit">
          <p>
            Confirm the line items, totals, and customer details. Click <strong>Submit as
            Proposal</strong> to save. The proposal appears in the list with an Open status.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Creating a proposal"
        description="Watch the full proposal creation flow from start to finish."
      />

      <h2>Differences from Order Creation</h2>
      <p>
        While the interface is nearly identical, proposals differ from orders in a few important
        ways:
      </p>
      <ul>
        <li>No inventory is allocated or reserved when a proposal is submitted.</li>
        <li>Proposals do not appear in pick list workflows until converted.</li>
        <li>Payment collection does not apply to proposals.</li>
        <li>Proposals can be freely edited until they are converted to an order.</li>
      </ul>

      <Callout type="tip">
        <p>
          If you are unsure whether to create an order or a proposal, start with a proposal. You
          can always convert it later with one click.
        </p>
      </Callout>
    </Article>
  )
}
