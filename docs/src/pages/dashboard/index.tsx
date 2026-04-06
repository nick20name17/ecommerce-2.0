import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function Dashboard() {
  return (
    <Article
      title="Dashboard"
      subtitle="Monitor business performance at a glance."
    >
      <p>
        The dashboard is the first screen you see after signing in. It provides a
        high-level view of your order activity, revenue, and outstanding
        balances. All data shown on the dashboard comes from EBMS and updates
        automatically as new orders are placed and invoices are processed.
      </p>

      <VideoSlot title="Dashboard overview" />

      <h2>KPI cards</h2>

      <p>
        Six key performance indicators are displayed across the top of the
        dashboard. Each card shows the current value, a comparison against the
        previous month where applicable, and a percentage change indicator.
      </p>

      <ul>
        <li>
          <strong>Orders</strong> — Total number of orders placed this month.
          Compared to last month's count with an up or down arrow.
        </li>
        <li>
          <strong>Unprocessed</strong> — Orders with a status of "Unprocessed"
          that are pending review. No month-over-month comparison since this is a
          point-in-time snapshot.
        </li>
        <li>
          <strong>Pending</strong> — Outstanding invoices that have not yet been
          paid. Also a current snapshot with no trend comparison.
        </li>
        <li>
          <strong>Total Sales</strong> — Total revenue for the current month.
          Shows a percentage change compared to last month.
        </li>
        <li>
          <strong>Avg Order</strong> — Average order value for the month.
          Compared against the previous month's average to highlight changes in
          order size.
        </li>
        <li>
          <strong>Outstanding</strong> — Total unpaid balance across all
          customers. This is a cumulative figure that helps track collection
          health.
        </li>
      </ul>

      <Callout type="tip">
        Green arrows indicate improvement over the previous month. Red arrows
        indicate a decline. A gray dash means the value is unchanged. If no
        previous data exists for comparison, the trend indicator is hidden.
      </Callout>

      <h2>Sales chart</h2>

      <p>
        Below the KPI cards, a sales chart visualizes order volume and revenue
        over time. This helps identify trends such as seasonal peaks, weekly
        patterns, or the impact of promotions. The chart updates as new order
        data syncs from EBMS.
      </p>

      <h2>Recent orders</h2>

      <p>
        The bottom section of the dashboard shows a table of recent orders. This
        gives you quick access to the latest activity without having to navigate
        to the full orders list. Each row shows the invoice number, customer
        name, date, status, and total. Click any row to open the full order
        detail page.
      </p>

      <h2>Customer filtering</h2>

      <p>
        If you are viewing the dashboard in the context of a specific customer
        (for example, from a customer detail page), the KPIs and charts adjust to
        reflect only that customer's data. This is useful for account managers who
        want to review a single customer's performance metrics without noise from
        the rest of the order book.
      </p>

      <Callout type="info">
        Dashboard data is scoped to the currently active project. If you manage
        multiple projects, make sure you have selected the correct one in the
        project switcher before drawing conclusions from the numbers.
      </Callout>
    </Article>
  )
}
