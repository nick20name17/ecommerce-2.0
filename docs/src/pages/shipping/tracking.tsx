import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function TrackingAndVoiding() {
  return (
    <Article
      title="Tracking & Voiding"
      subtitle="Monitor shipment progress and cancel labels when needed."
    >
      <h2>Viewing Shipment Details</h2>
      <p>
        Click any shipment row to open its detail page. The detail view shows the complete
        shipping record including the carrier name, service level, ship-from and ship-to
        addresses, package dimensions, weight, and label cost. All line items included in the
        shipment are listed with their quantities for easy verification.
      </p>

      <VideoSlot
        title="Shipment details and tracking"
        description="See how to review shipment details and track packages."
      />

      <h2>Tracking Numbers and Labels</h2>
      <p>
        Every purchased label generates a tracking number that is displayed prominently on the
        shipment detail page. Click the tracking number to open the carrier's tracking page in
        a new browser tab, where you can see real-time delivery status and estimated arrival.
        The shipping label itself can be downloaded as a PDF for printing directly from the
        detail page.
      </p>

      <Callout type="tip">
        <p>
          Copy the tracking number with one click using the copy button next to it. This makes
          it easy to paste into customer emails or support tickets.
        </p>
      </Callout>

      <h2>Voiding Shipments</h2>
      <p>
        If a shipment needs to be canceled, you can void the shipping label from the detail page.
        Voiding notifies the carrier and requests a refund for the label cost.
      </p>

      <Steps>
        <Step number={1} title="Open the shipment">
          <p>
            Navigate to the shipment detail page from the shipments list or the associated pick
            list.
          </p>
        </Step>
        <Step number={2} title="Click Void Shipment">
          <p>
            Click the <strong>Void Shipment</strong> button in the header. A confirmation dialog
            appears explaining the implications.
          </p>
        </Step>
        <Step number={3} title="Confirm the void">
          <p>
            Click <strong>Confirm</strong> to proceed. The shipment status changes to Voided and
            the label is invalidated with the carrier.
          </p>
        </Step>
      </Steps>

      <Callout type="warning">
        <p>
          Void labels as soon as possible after deciding to cancel. Most carriers only allow
          voids within a limited window, typically the same business day. After that window, the
          label charge may not be refundable.
        </p>
      </Callout>

      <Callout type="info">
        <p>
          Voided shipments remain in the shipments list for record-keeping. They are clearly
          marked with a Voided badge and can be filtered out of the default view.
        </p>
      </Callout>
    </Article>
  )
}
