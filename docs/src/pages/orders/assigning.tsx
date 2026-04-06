import { Article } from '@/components/article'
import { Step } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function AssigningUsers() {
  return (
    <Article
      title="Assigning Users"
      subtitle="Distribute order responsibilities across your team."
    >
      <p>
        EBMS Ecommerce supports multi-user assignment on orders, proposals, and
        customers. Assigning a user to an order signals that they are responsible
        for handling it — whether that means processing it, following up with the
        customer, or coordinating fulfillment. Multiple users can be assigned to
        the same order, and assignments can be changed at any time.
      </p>

      <VideoSlot title="Assigning users to orders" />

      <h2>How multi-assign works</h2>

      <p>
        Unlike a simple single-owner model, EBMS Ecommerce allows you to assign
        multiple team members to a single order. This is useful in organizations
        where different people handle different stages of order fulfillment — for
        example, one person manages the customer relationship while another
        handles warehouse picking.
      </p>

      <p>
        Assigned users appear as avatar chips on the order row in the list view
        and on the order detail page. Each chip shows the user's initials. When
        you assign or unassign users, the change takes effect immediately and is
        visible to all team members.
      </p>

      <Callout type="info">
        Assignment is a platform-level feature and does not sync to EBMS. It is
        used solely within the ecommerce app for team coordination and
        filtering. Only admin users can assign or unassign team members.
      </Callout>

      <h2>Assign from the list view</h2>

      <Step number={1} title="Open the context menu">
        On the orders list page, find the order you want to assign. Click the
        three-dot menu icon on the right side of the row.
      </Step>

      <Step number={2} title="Select Assign">
        Choose <strong>Assign</strong> from the dropdown menu. The multi-assign
        dialog opens.
      </Step>

      <Step number={3} title="Select users">
        The dialog shows a list of all team members in your project. Users who
        are already assigned to this order are shown with a checkmark. Click a
        user to toggle their assignment — clicking an unassigned user adds them,
        clicking an assigned user removes them.
      </Step>

      <Step number={4} title="Confirm">
        Changes are saved as you select and deselect users. Close the dialog
        when you are done. The order row updates to show the new assignment
        chips.
      </Step>

      <h2>Assign from the detail view</h2>

      <Step number={1} title="Open the order">
        Click on any order in the list to open its detail page.
      </Step>

      <Step number={2} title="Click the assign button">
        In the toolbar at the top of the order detail page, click the assign
        icon (person with a plus sign). The same multi-assign dialog opens.
      </Step>

      <Step number={3} title="Toggle assignments">
        Select or deselect team members as needed. The assigned users section on
        the order detail page updates immediately when you close the dialog.
      </Step>

      <Callout type="tip">
        You can assign users to multiple orders in sequence from the list view
        without leaving the page. Open the context menu on one order, assign
        users, close the dialog, then move to the next order.
      </Callout>

      <h2>Filter by assigned to me</h2>

      <p>
        Once orders are assigned, the <strong>Assigned to me</strong> filter on
        the orders list page becomes especially useful. Click the filter chip to
        narrow the view to only orders where your account is one of the assigned
        users.
      </p>

      <p>
        This works in combination with other filters. For example, you can view
        only Unprocessed orders assigned to you, giving you a focused work queue
        of items that need your attention.
      </p>

      <Callout type="warning">
        Only admin users see the Assign option in the context menu and toolbar.
        If you do not see the assign button, your account may not have admin
        privileges. Contact your system administrator to adjust your role if
        needed.
      </Callout>

      <h2>Assignments on other entities</h2>

      <p>
        The same multi-assign pattern works on proposals and customers. On the
        customers list, you can assign team members to customer accounts, making
        it clear who owns each relationship. On the proposals list, assignments
        help track who is responsible for following up on open quotes.
      </p>
    </Article>
  )
}
