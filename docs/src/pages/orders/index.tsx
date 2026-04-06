import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'
import { Kbd } from '@/components/kbd'

export function OrdersOverview() {
  return (
    <Article
      title="Orders Overview"
      subtitle="View and manage all orders synced from EBMS."
    >
      <p>
        The Orders page is the central place for managing invoiced orders. Every
        order created through the Order Desk or placed on your ecommerce website
        appears here after it syncs with EBMS. From this page you can search,
        filter, sort, assign team members, and drill into individual order
        details.
      </p>

      <VideoSlot title="Orders list walkthrough" />

      <h2>What is an order?</h2>

      <p>
        In EBMS Ecommerce, an order represents an invoiced transaction with a
        customer. Orders are synced from EBMS and include all line items,
        pricing, tax, shipping addresses, and status information. Orders differ
        from proposals (quotes) in that they have been confirmed and assigned an
        invoice number by EBMS.
      </p>

      <p>
        Each order has one of three statuses:
      </p>

      <ul>
        <li>
          <strong>Unprocessed</strong> — The order has been placed but has not
          been reviewed or fulfilled yet. These are typically new orders that need
          attention. Shown with an amber badge.
        </li>
        <li>
          <strong>Outstanding</strong> — The order has been processed and an
          invoice was sent, but payment has not been received. Shown with a blue
          badge.
        </li>
        <li>
          <strong>Paid Invoice</strong> — The invoice has been paid in full and
          the order is complete. Shown with a green badge.
        </li>
      </ul>

      <Callout type="info">
        Statuses are managed in EBMS and sync to the platform automatically. You
        cannot change an order's status directly in the ecommerce app — status
        changes happen in EBMS when invoices are processed or payments are
        recorded.
      </Callout>

      <h2>List view</h2>

      <p>
        Orders are displayed in a table with columns for invoice number, customer
        name, date, status, total, balance, quantity, and assigned users. The
        exact columns visible depend on your project's field configuration, which
        an admin can customize in Settings.
      </p>

      <p>
        Click any column header to sort by that field. Click again to reverse the
        sort direction. An arrow icon indicates the current sort column and
        direction. By default, orders are sorted by invoice number in ascending
        order.
      </p>

      <p>
        Pagination controls at the bottom of the table let you navigate through
        large result sets. The current page and total count are always visible so
        you know how many orders match your active filters.
      </p>

      <Callout type="tip">
        Use <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> for a faster way to find a specific
        order by invoice number or customer name without scrolling through the
        list.
      </Callout>

      <h2>Expanding rows</h2>

      <p>
        Click the expand arrow on any order row to see a preview of its line
        items without leaving the list page. This is useful for quickly checking
        what a customer ordered before opening the full detail view.
      </p>

      <h2>Quick actions</h2>

      <p>
        Each row has a context menu (the three-dot icon on the right) with
        actions you can take without opening the order detail page:
      </p>

      <ul>
        <li>
          <strong>Assign</strong> — Open the assign dialog to add or remove team
          members from the order.
        </li>
        <li>
          <strong>Attachments</strong> — View or upload file attachments.
        </li>
        <li>
          <strong>Notes</strong> — Open the notes panel to read or add notes.
        </li>
        <li>
          <strong>Delete</strong> — Remove the order from the platform (does not
          affect EBMS).
        </li>
      </ul>
    </Article>
  )
}
