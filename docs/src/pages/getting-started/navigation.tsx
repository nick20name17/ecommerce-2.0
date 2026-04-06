import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'
import { Kbd } from '@/components/kbd'

export function Navigation() {
  return (
    <Article
      title="Navigation"
      subtitle="Find your way around the EBMS Ecommerce interface."
    >
      <p>
        The application uses a sidebar-based layout. The sidebar is always
        visible on desktop and can be toggled on mobile. Every major section of
        the platform is accessible from the sidebar, and a global search lets you
        jump to specific records without clicking through menus.
      </p>

      <VideoSlot title="Navigating the sidebar and search" />

      <h2>Sidebar</h2>

      <p>
        The sidebar is divided into three areas. At the top you will find quick
        action pages, in the middle your main workspace sections, and at the
        bottom utility links.
      </p>

      <h3>Top section</h3>
      <ul>
        <li>
          <strong>Home</strong> — The dashboard with KPIs, charts, and recent
          orders. Visible to admin users.
        </li>
        <li>
          <strong>Order Desk</strong> — Create new orders and proposals from
          scratch.
        </li>
        <li>
          <strong>Pick Lists</strong> — Manage warehouse picking for order
          fulfillment.
        </li>
        <li>
          <strong>Shipping</strong> — Track shipments and fulfillment progress.
        </li>
      </ul>

      <h3>Workspace section</h3>
      <ul>
        <li>
          <strong>Customers</strong> — Customer directory synced from EBMS.
        </li>
        <li>
          <strong>Orders</strong> — All invoiced orders with filtering and
          assignment.
        </li>
        <li>
          <strong>Proposals</strong> — Quotes and proposals not yet converted to
          orders.
        </li>
        <li>
          <strong>To-Do's</strong> — Task management with list and Kanban views.
          Shows a count badge for active tasks.
        </li>
        <li>
          <strong>Activity</strong> — Audit log of recent actions across the
          platform (admin only).
        </li>
        <li>
          <strong>Settings</strong> — Configure fields, filter presets, and
          shipping addresses (admin only).
        </li>
      </ul>

      <p>
        Some items display live indicators. The Orders and Proposals links show a
        spinner when new records are being created. The To-Do's link shows a
        badge with the count of active (non-completed) tasks.
      </p>

      <Callout type="info">
        Items marked as admin-only will not appear in the sidebar if your account
        does not have admin or super admin privileges.
      </Callout>

      <h2>Global search</h2>

      <p>
        Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> (or <Kbd>Ctrl</Kbd> +{' '}
        <Kbd>K</Kbd> on Windows) to open the global search overlay. You can also
        click the search bar at the top of the sidebar.
      </p>

      <p>
        Start typing to search across orders and customers simultaneously.
        Results appear as you type with a short debounce. Use the arrow keys to
        navigate the results list and press <Kbd>Enter</Kbd> to open the
        selected record. Press <Kbd>Esc</Kbd> to close search without
        navigating.
      </p>

      <Callout type="tip">
        Search matches against invoice numbers, customer names, and other key
        fields. Type at least two characters to trigger results.
      </Callout>

      <h2>Project switcher</h2>

      <p>
        If your organization manages multiple EBMS projects, the project switcher
        appears in the sidebar header. Click it to switch between projects. All
        data in the application — orders, customers, products, tasks — is scoped
        to the active project. Switching projects reloads the relevant data
        automatically.
      </p>

      <p>
        A health indicator next to the project name shows the status of the EBMS
        connection, backend services, and sync process. Green means everything is
        healthy. If you see a warning indicator, hover over it for details about
        which service is affected.
      </p>

      <h2>Notifications</h2>

      <p>
        The platform uses real-time WebSocket connections to deliver
        notifications. When a relevant event occurs — such as a new order being
        placed on the website or a pick list being completed — you may see a
        toast notification and affected data will refresh automatically. There is
        no notification center to manage; updates flow into the views you are
        already looking at.
      </p>
    </Article>
  )
}
