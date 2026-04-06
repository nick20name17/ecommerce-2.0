import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function PickListsOverview() {
  return (
    <Article
      title="Pick Lists Overview"
      subtitle="Understand the picking workflow that moves orders from warehouse to shipment."
    >
      <h2>What Is Picking?</h2>
      <p>
        Picking is the warehouse process of selecting items from inventory to fulfill customer
        orders. In EBMS, a pick list groups one or more order line items that need to be pulled,
        packed, and shipped together. Pick lists are the bridge between an approved order and a
        physical shipment leaving your warehouse.
      </p>

      <VideoSlot
        title="Pick lists overview"
        description="Learn the purpose of pick lists and how they fit into the order lifecycle."
      />

      <h2>Pick List Statuses</h2>
      <p>
        Each pick list moves through a series of statuses that reflect its progress:
      </p>
      <ul>
        <li><strong>Draft</strong> — the pick list has been created but not yet finalized. Items and quantities can still be adjusted.</li>
        <li><strong>Pushed</strong> — the pick list has been sent to EBMS for warehouse processing. No further edits are allowed.</li>
        <li><strong>Shipped</strong> — a shipping label has been purchased and the package is in transit.</li>
        <li><strong>Voided</strong> — the pick list or its shipment has been canceled.</li>
      </ul>

      <Callout type="info">
        <p>
          Only pick lists in Draft status can be edited. Once pushed to EBMS, the pick list is
          locked and must be voided if changes are needed.
        </p>
      </Callout>

      <h2>Pick List Lifecycle</h2>
      <p>
        The typical lifecycle flows from creation through shipping. You create a pick list by
        selecting order line items and quantities, optionally get shipping rates and purchase a
        label, then push the pick list to EBMS. Once the warehouse fulfills the pick and the
        package ships, the pick list automatically moves to Shipped status based on tracking
        updates.
      </p>

      <Callout type="tip">
        <p>
          You can create multiple pick lists for a single order if the items need to ship
          separately or from different locations.
        </p>
      </Callout>
    </Article>
  )
}
