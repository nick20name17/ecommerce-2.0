import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function UserManagement() {
  return (
    <Article
      title="User Management"
      subtitle="Create accounts, assign roles, and control access to the platform."
    >
      <h2>Creating Users</h2>
      <p>
        Admins can create new user accounts from the User Management settings page. Each user
        needs a name, email address, and an assigned role. After creation, the user can log in
        with their credentials and access the platform according to their role's permissions.
      </p>

      <Steps>
        <Step number={1} title="Open User Management">
          <p>
            Navigate to Settings and select <strong>Users & Permissions</strong> from the sidebar.
          </p>
        </Step>
        <Step number={2} title="Add a new user">
          <p>
            Click <strong>Add User</strong> and enter the user's name and email address.
          </p>
        </Step>
        <Step number={3} title="Assign a role">
          <p>
            Select a role from the dropdown: Admin, Sale, or Manager. The role determines what
            the user can see and do within the platform.
          </p>
        </Step>
        <Step number={4} title="Save">
          <p>
            Click <strong>Create</strong>. The user appears in the user list and can begin
            logging in.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Managing users"
        description="Watch how to create users, assign roles, and manage access."
      />

      <h2>Roles</h2>
      <p>
        EBMS uses three roles with different permission levels:
      </p>
      <ul>
        <li>
          <strong>Admin</strong> — full access to all features including Settings, user
          management, and field configuration.
        </li>
        <li>
          <strong>Manager</strong> — access to all operational features (orders, proposals,
          customers, picking, tasks) but no access to Settings.
        </li>
        <li>
          <strong>Sale</strong> — access to orders, proposals, customers, and tasks. Cannot
          access picking, shipping, or Settings.
        </li>
      </ul>

      <Callout type="info">
        <p>
          Role changes take effect on the user's next page load. There is no need for the user
          to log out and back in.
        </p>
      </Callout>

      <h2>Activating and Deactivating Users</h2>
      <p>
        Instead of deleting user accounts, EBMS supports activation and deactivation. A
        deactivated user cannot log in but their historical data (assignments, created orders,
        task history) is preserved. To deactivate a user, open their row in the user list and
        toggle the <strong>Active</strong> switch off. Reactivate at any time by toggling it
        back on.
      </p>

      <Callout type="warning">
        <p>
          Be careful when deactivating users who are assigned to active orders or tasks. Consider
          reassigning their work before deactivation to avoid orphaned assignments.
        </p>
      </Callout>
    </Article>
  )
}
