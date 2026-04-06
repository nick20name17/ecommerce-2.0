import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function CustomerDetails() {
  return (
    <Article
      title="Customer Details"
      subtitle="Explore every aspect of a customer account from a single page."
    >
      <h2>Dashboard Tab</h2>
      <p>
        The dashboard tab is the default view when you open a customer. It provides a high-level
        snapshot of the account with key performance indicators such as total revenue, average
        order value, and order count. Interactive charts show trends over time so you can quickly
        gauge account health and spot opportunities.
      </p>

      <VideoSlot
        title="Customer detail walkthrough"
        description="Tour the customer detail page and its tabs."
      />

      <h2>Orders Tab</h2>
      <p>
        The orders tab lists every order placed by this customer, sorted by date. You can search
        within the list, filter by status, and click any order to jump directly to its detail
        page. This gives you full order history without leaving the customer context.
      </p>

      <h2>Proposals Tab</h2>
      <p>
        Similar to the orders tab, the proposals tab shows all proposals associated with the
        customer. Use it to review pending quotes, check which proposals have been converted,
        and track the overall quoting pipeline for the account.
      </p>

      <h2>Tasks Tab</h2>
      <p>
        The tasks tab surfaces all tasks linked to this customer. Whether it is a follow-up
        call, a pending approval, or a custom workflow step, you can see the full task list,
        create new tasks, and update statuses directly from the customer page.
      </p>

      <h2>Customer Properties Sidebar</h2>
      <p>
        On the right side of the detail page, a sidebar displays the customer's core properties:
        contact information, billing and shipping addresses, price level, assigned sales rep, and
        any custom fields your organization has configured. Fields that are editable show a
        pencil icon on hover.
      </p>

      <Callout type="tip">
        <p>
          Use the sidebar's quick-edit controls to update fields like sales rep assignment or
          price level without navigating away from the page.
        </p>
      </Callout>
    </Article>
  )
}
