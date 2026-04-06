import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'
import { Kbd } from '@/components/kbd'

export function GettingStarted() {
  return (
    <Article
      title="Welcome to EBMS Ecommerce"
      subtitle="Your B2B order management platform, connected to EBMS."
    >
      <p>
        EBMS Ecommerce is a web-based platform that extends your EBMS business
        management system with a modern interface for managing orders, proposals,
        customers, products, picking, and shipping. Everything you do here syncs
        back to EBMS in real time, so your team always works from a single source
        of truth.
      </p>

      <VideoSlot title="Platform overview walkthrough" />

      <h2>What you can do</h2>

      <p>
        The platform is organized around the day-to-day workflows your team uses
        most. Here is a quick summary of each major area:
      </p>

      <ul>
        <li>
          <strong>Dashboard</strong> — See KPIs like total orders, revenue,
          unprocessed orders, and outstanding invoices at a glance. A sales chart
          tracks trends over time and a recent orders table keeps you up to date.
        </li>
        <li>
          <strong>Order Desk</strong> — Create new orders and proposals from
          scratch. Select a customer, browse the product catalog, configure line
          items, and submit directly to EBMS.
        </li>
        <li>
          <strong>Orders &amp; Proposals</strong> — View, filter, sort, and
          manage all orders and proposals synced from EBMS. Assign team members,
          attach files, add notes, and track statuses.
        </li>
        <li>
          <strong>Customers</strong> — Look up customer records, view their order
          history, and manage assignments. Customer data syncs from EBMS
          automatically.
        </li>
        <li>
          <strong>Pick Lists</strong> — Create pick lists from orders, track
          picked quantities, and push shipment data back to EBMS when fulfillment
          is complete.
        </li>
        <li>
          <strong>Shipping</strong> — Manage shipments, view tracking info, and
          monitor fulfillment progress across all orders.
        </li>
        <li>
          <strong>To-Do's</strong> — Create and assign tasks related to orders,
          customers, or general work. Use the Kanban board or list view to
          organize your team's work.
        </li>
      </ul>

      <Callout type="tip">
        Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> from anywhere in the app to open
        global search. You can quickly jump to any order or customer without
        navigating through menus.
      </Callout>

      <h2>Quick links</h2>

      <ul>
        <li>
          <a href="/getting-started/signing-in">Signing In</a> — Set up your
          account and log in for the first time.
        </li>
        <li>
          <a href="/getting-started/navigation">Navigation</a> — Learn how the
          sidebar, search, and project switcher work.
        </li>
        <li>
          <a href="/orders">Orders Overview</a> — Start working with orders
          right away.
        </li>
        <li>
          <a href="/orders/creating">Creating Orders</a> — Walk through the
          Order Desk to create your first order.
        </li>
        <li>
          <a href="/dashboard">Dashboard</a> — Understand the metrics and charts
          on your home screen.
        </li>
      </ul>

      <Callout type="info">
        EBMS Ecommerce requires an active EBMS connection. If data appears
        outdated or missing, check the project health indicator in the sidebar
        header to verify that the sync is running.
      </Callout>
    </Article>
  )
}
