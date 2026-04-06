import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ManagingPickLists() {
  return (
    <Article
      title="Managing Pick Lists"
      subtitle="Push pick lists to EBMS, void labels, and review shipment details."
    >
      <h2>Pushing to EBMS</h2>
      <p>
        Once a pick list is finalized and optionally has a shipping label attached, push it to
        EBMS to begin warehouse fulfillment. Pushing locks the pick list so no further changes
        can be made. The warehouse team receives the pick instructions in their workflow
        automatically.
      </p>

      <Steps>
        <Step number={1} title="Review the pick list">
          <p>
            Open the pick list detail page and verify the line items, quantities, and ship-to
            address are correct.
          </p>
        </Step>
        <Step number={2} title="Push to EBMS">
          <p>
            Click <strong>Push to EBMS</strong>. The pick list status changes from Draft to
            Pushed and the data is sent to the back-office system.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Managing pick lists"
        description="Learn how to push, void, and review pick list details."
      />

      <h2>Voiding Labels</h2>
      <p>
        If a shipping label was purchased in error or the shipment needs to be canceled, you can
        void the label from the pick list detail page. Click <strong>Void Label</strong> and
        confirm the action. The carrier is notified and the label charge is refunded according
        to the carrier's void policy. The pick list status updates to reflect the voided state.
      </p>

      <Callout type="warning">
        <p>
          Most carriers require labels to be voided within a specific window, typically before the
          end of the business day. Void promptly to ensure you receive a refund.
        </p>
      </Callout>

      <h2>Viewing Shipment Details</h2>
      <p>
        The pick list detail page shows the complete shipment summary including the carrier name,
        service level, tracking number, label cost, and package contents. Each line item in the
        pick list is displayed with its picked quantity so you can confirm exactly what was
        included in the shipment. Click the tracking number to open the carrier's tracking page
        in a new tab.
      </p>

      <Callout type="tip">
        <p>
          Use the pick list's shipment details as a packing slip reference. All the information
          the warehouse team needs is available on this single page.
        </p>
      </Callout>
    </Article>
  )
}
