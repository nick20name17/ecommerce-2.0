import { Article } from '@/components/article'
import { Step } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function OrderDetails() {
  return (
    <Article
      title="Order Details"
      subtitle="Everything you can see and do on an individual order."
    >
      <p>
        The order detail page shows all the information about a single order in
        one place. You can view properties, line items, shipping data, notes, and
        attachments. You can also take actions like assigning users, creating
        tasks, and starting the picking process — all without leaving the page.
      </p>

      <VideoSlot title="Order detail page walkthrough" />

      <h2>Order properties</h2>

      <p>
        The left panel displays the order's metadata organized into tabs:
      </p>

      <ul>
        <li>
          <strong>General</strong> — Invoice number, status, customer name, order
          date, due date, salesperson, price level, totals, and balance. Editable
          fields show a pencil icon when hovered; click to modify inline.
        </li>
        <li>
          <strong>Custom</strong> — Any custom fields configured for your project
          in Settings. These map to EBMS user-defined fields and can be edited if
          your admin has enabled them.
        </li>
        <li>
          <strong>Shipments</strong> — Shipping information including addresses,
          carriers, tracking numbers, and fulfillment status. If pick lists have
          been created for this order, their shipment data appears here.
        </li>
      </ul>

      <Callout type="info">
        The status badge at the top uses color coding: amber for Unprocessed,
        blue for Outstanding, and green for Paid Invoice. This matches the badge
        colors in the orders list for consistency.
      </Callout>

      <h2>Line items</h2>

      <p>
        The center of the page shows a table of all products on the order. Each
        row includes the item code, description, quantity ordered, quantity
        shipped, unit price, and line total. A summary row at the bottom shows
        the order subtotal, tax, and grand total.
      </p>

      <p>
        The quantity columns give you an at-a-glance view of fulfillment
        progress. If the shipped quantity matches the ordered quantity, the order
        is fully fulfilled.
      </p>

      <h2>Notes and attachments</h2>

      <p>
        Use the toolbar buttons at the top of the page to open the notes panel
        or attachments dialog:
      </p>

      <ul>
        <li>
          <strong>Notes</strong> — A slide-out sheet where team members can add
          timestamped notes about the order. Notes are visible to all users who
          have access to the order.
        </li>
        <li>
          <strong>Attachments</strong> — Upload and manage files attached to the
          order. Commonly used for purchase orders, packing slips, or customer
          correspondence.
        </li>
      </ul>

      <h2>Actions</h2>

      <p>
        The order detail page provides several actions accessible from the
        toolbar:
      </p>

      <Step number={1} title="Assign users">
        Click the assign icon to open the multi-assign dialog. Select one or more
        team members to assign to this order. See the{' '}
        <a href="/orders/assigning">Assigning Users</a> guide for details.
      </Step>

      <Step number={2} title="Create a task">
        Click the task icon to open the quick task creator. This creates a new
        to-do linked to the current order. The task will appear in the To-Do's
        section and include a reference back to this order.
      </Step>

      <Step number={3} title="Start picking">
        Click the picking icon to open the start picking dialog. This creates a
        new pick list pre-populated with the order's line items. From there, your
        warehouse team can track picked quantities and prepare the shipment.
      </Step>

      <Step number={4} title="Get shipping rates">
        Click the shipping icon to open the shipping rates dialog. This queries
        available carriers and rates based on the order's shipping address and
        package dimensions.
      </Step>

      <Callout type="tip">
        You can copy the order's direct URL from the address bar and share it
        with a colleague. The link takes them straight to this order detail page
        after they sign in.
      </Callout>

      <h2>Editing fields</h2>

      <p>
        Editable property fields in the left panel support inline editing. Hover
        over a field and click the pencil icon to enter edit mode. Make your
        change and press <strong>Enter</strong> or click away to save. Changes
        are sent to EBMS immediately and a confirmation toast appears when the
        update succeeds.
      </p>

      <Callout type="warning">
        Not all fields are editable. Fields controlled by EBMS calculations
        (such as totals and balances) are read-only. Your admin controls which
        fields are editable through the Settings page.
      </Callout>
    </Article>
  )
}
