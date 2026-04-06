import { Article } from '@/components/article'
import { Step } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function OrderFiltering() {
  return (
    <Article
      title="Filtering & Presets"
      subtitle="Find the exact orders you need with filters, search, and saved presets."
    >
      <p>
        The orders list supports a combination of status filters, assignment
        filters, text search, column sorting, and saved filter presets. These
        tools work together so you can narrow down large order sets to exactly
        the records you need. Filter state is stored in the URL, making it easy
        to bookmark or share a filtered view with a colleague.
      </p>

      <VideoSlot title="Filtering and presets demo" />

      <h2>Status filter</h2>

      <p>
        The status filter chips appear at the top of the orders list. Click a
        status to filter the list to only orders with that status:
      </p>

      <ul>
        <li>
          <strong>Unprocessed</strong> — Show only new, unreviewed orders. This
          is the default filter when you first open the orders page, so you
          immediately see what needs attention.
        </li>
        <li>
          <strong>Outstanding</strong> — Show invoiced orders awaiting payment.
        </li>
        <li>
          <strong>Paid Invoice</strong> — Show fully paid, completed orders.
        </li>
      </ul>

      <p>
        Click the active status chip again to deselect it and show all orders
        regardless of status.
      </p>

      <h2>Assigned to me</h2>

      <p>
        Click the <strong>Assigned to me</strong> filter chip to narrow the list
        to only orders where you are one of the assigned users. This is useful
        when the team has divided up order processing responsibilities and you
        want to focus on your own workload.
      </p>

      <Callout type="tip">
        Combine status and assignment filters for maximum focus. For example,
        select "Unprocessed" and "Assigned to me" to see only the new orders
        you are personally responsible for.
      </Callout>

      <h2>Text search</h2>

      <p>
        The search input at the top of the page filters orders as you type.
        Search matches against invoice numbers, customer names, and other indexed
        fields. Results update after a short debounce as you type. Clear the
        search field to return to the full filtered list.
      </p>

      <h2>Column sorting</h2>

      <p>
        Click any sortable column header to sort the orders list by that field.
        Supported sort fields include invoice number, customer name, invoice
        date, total, and balance. Click the same column header again to toggle
        between ascending and descending order. An arrow icon on the column
        header shows the current direction.
      </p>

      <h2>Saved filter presets</h2>

      <p>
        Admins can create saved filter presets that appear as quick-select
        options for the entire team. Presets capture a combination of filter
        criteria — such as status, assigned user, or custom field values — and
        give them a name for easy reuse.
      </p>

      <Step number={1} title="Select a preset">
        Click the preset picker dropdown in the filter bar. A list of available
        presets appears. Click one to apply its filters instantly.
      </Step>

      <Step number={2} title="Create a preset (admin)">
        Navigate to <strong>Settings</strong> and find the Filter Groups section.
        Here you can create, edit, and delete filter presets. Each preset defines
        the filter criteria that will be applied when a user selects it.
      </Step>

      <Callout type="info">
        Filter presets are configured by admins and shared across the team.
        Individual users cannot create personal presets — the intent is to
        standardize common views like "My Unprocessed Orders" or "High-Value
        Outstanding" for everyone.
      </Callout>

      <h2>URL persistence</h2>

      <p>
        All filter state — status, assignment, search text, sort column, sort
        direction, page offset, and active preset — is reflected in the page URL
        as query parameters. This means you can:
      </p>

      <ul>
        <li>
          Bookmark a specific filtered view and return to it later.
        </li>
        <li>
          Copy the URL and send it to a colleague. When they open the link, they
          see the exact same filtered results.
        </li>
        <li>
          Use the browser's back and forward buttons to navigate between
          different filter states you have visited.
        </li>
      </ul>

      <Callout type="tip">
        If you find yourself applying the same filters every day, bookmark the
        URL after setting up your preferred view. Opening that bookmark takes you
        straight to your filtered list without any extra clicks.
      </Callout>

      <h2>Pagination</h2>

      <p>
        When filter results span multiple pages, pagination controls appear at
        the bottom of the table. The controls show the total number of matching
        records and let you navigate forward and backward through the result
        set. The page size is set at the application level and applies
        consistently across all list views.
      </p>
    </Article>
  )
}
