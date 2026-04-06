import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ShipmentsList() {
  return (
    <Article
      title="Shipments List"
      subtitle="View and manage all shipments across your orders."
    >
      <h2>Viewing All Shipments</h2>
      <p>
        The shipments page provides a centralized view of every shipment created in the system.
        Each row displays the shipment ID, associated order number, carrier, service level,
        tracking number, ship date, and current status. This gives your team a single place to
        monitor all outbound packages regardless of which order they belong to.
      </p>

      <VideoSlot
        title="Shipments list overview"
        description="Tour the shipments list and learn how to find specific shipments."
      />

      <h2>Filtering Shipments</h2>
      <p>
        Use the filter bar to narrow the shipment list by various criteria:
      </p>
      <ul>
        <li><strong>Status</strong> — filter by active, delivered, or voided shipments.</li>
        <li><strong>Carrier</strong> — show only shipments for a specific carrier.</li>
        <li><strong>Date range</strong> — find shipments created within a time window.</li>
        <li><strong>Order number</strong> — locate all shipments tied to a specific order.</li>
      </ul>
      <p>
        The voided filter is especially useful for auditing. Toggle it to see which labels were
        canceled and when, helping you track refund eligibility and identify patterns.
      </p>

      <h2>Searching Shipments</h2>
      <p>
        The search bar matches against shipment IDs, order numbers, and tracking numbers. If a
        customer calls with a tracking number, paste it into the search field to instantly pull
        up the associated shipment and order details.
      </p>

      <Callout type="tip">
        <p>
          Bookmark the shipments page as a go-to resource for your shipping team. Combining
          search with status filters makes it easy to answer customer inquiries about package
          status in seconds.
        </p>
      </Callout>

      <Callout type="info">
        <p>
          Shipment records are created automatically when a shipping label is purchased from a
          pick list. You do not need to create shipments manually.
        </p>
      </Callout>
    </Article>
  )
}
