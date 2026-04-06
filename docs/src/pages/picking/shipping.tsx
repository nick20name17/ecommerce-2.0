import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ShippingRatesAndLabels() {
  return (
    <Article
      title="Shipping Rates & Labels"
      subtitle="Get live carrier rates, select a service, and purchase shipping labels."
    >
      <h2>Getting Shipping Rates</h2>
      <p>
        After creating a pick list, you can request shipping rates from integrated carriers.
        EBMS uses the pick list's ship-to address, package dimensions, and total weight to
        query available services and their costs in real time. Rates are displayed sorted by
        price so you can quickly choose the most cost-effective option.
      </p>

      <Steps>
        <Step number={1} title="Enter package dimensions">
          <p>
            Specify the package length, width, height, and weight. If your products have default
            dimensions configured, these are pre-filled automatically. Adjust as needed for the
            actual package being shipped.
          </p>
        </Step>
        <Step number={2} title="Request rates">
          <p>
            Click <strong>Get Rates</strong> to fetch live pricing from all configured carriers.
            Results typically appear within a few seconds.
          </p>
        </Step>
        <Step number={3} title="Select a service">
          <p>
            Review the available services, delivery estimates, and prices. Click on a rate to
            select it for label purchase.
          </p>
        </Step>
        <Step number={4} title="Purchase the label">
          <p>
            Confirm your selection and click <strong>Buy Label</strong>. The shipping label is
            generated and a tracking number is assigned to the pick list immediately.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Shipping rates and label purchase"
        description="See how to get rates, select a carrier, and buy a label."
      />

      <h2>Package Dimensions</h2>
      <p>
        Accurate package dimensions are important for getting correct rates. Carriers calculate
        shipping costs using both actual weight and dimensional weight (based on package size).
        Enter dimensions in inches and weight in pounds for the most accurate quotes.
      </p>

      <h2>Tracking Numbers</h2>
      <p>
        Once a label is purchased, the tracking number is stored on the pick list and is visible
        on the shipment detail page. Tracking numbers are also accessible from the order detail
        page, giving you and your customers full visibility into delivery status.
      </p>

      <Callout type="tip">
        <p>
          If rates seem higher than expected, double-check the package dimensions. Oversized
          dimensions can trigger dimensional weight surcharges from carriers.
        </p>
      </Callout>
    </Article>
  )
}
