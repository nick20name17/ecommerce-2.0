import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function StartPicking() {
  return (
    <Article
      title="Start Picking"
      subtitle="Create a pick list by selecting orders, setting quantities, and choosing a ship-to address."
    >
      <h2>Creating a Pick List</h2>
      <p>
        To create a pick list, select an order — then EBMS Online gives you the
        option to pull in any other open orders from that same customer. From
        there, the picker works through one consolidated list instead of bouncing
        between orders.
      </p>

      <Steps>
        <Step number={1} title="Select orders and line items">
          <p>
            Choose the order or orders you want to fulfill. For each order, select the specific
            line items to include in this pick list. You do not need to include every item from
            an order in a single pick list.
          </p>
        </Step>
        <Step number={2} title="Set pick quantities">
          <p>
            For each selected line item, enter the quantity to pick. This can be less than or
            equal to the ordered quantity. Partial picks are common when stock is limited or
            items ship from different locations.
          </p>
        </Step>
        <Step number={3} title="Review parent and component items">
          <p>
            If a line item is a parent product with component items (such as a kit or bundle),
            the components are displayed beneath the parent. Quantities for components are
            calculated automatically based on the parent pick quantity.
          </p>
        </Step>
        <Step number={4} title="Choose ship-to address">
          <p>
            Select a ship-to address from the customer's saved addresses or the addresses
            configured in settings. This address is used when generating shipping rates and
            labels.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Creating a pick list"
        description="Watch the full pick list creation flow step by step."
      />

      <Callout type="warning">
        <p>
          Double-check pick quantities before proceeding. Once a pick list is pushed to EBMS,
          quantities cannot be adjusted without voiding the entire pick list.
        </p>
      </Callout>

      <Callout type="tip">
        <p>
          Use partial picks strategically to ship available items immediately while backordered
          items wait for stock.
        </p>
      </Callout>
    </Article>
  )
}
