import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function SettingsOverview() {
  return (
    <Article
      title="Settings Overview"
      subtitle="Configure the platform to match your team's workflows."
    >
      <h2>Who Can Access Settings</h2>
      <p>
        The Settings section is restricted to users with the <strong>Admin</strong> role. Standard
        users (Sale and Manager roles) do not see the Settings link in the sidebar and cannot
        access settings pages directly. This ensures that configuration changes are made
        deliberately by authorized team members.
      </p>

      <Callout type="warning">
        <p>
          If you need settings access but do not have it, contact an admin on your team to have
          your role upgraded or to make the change on your behalf.
        </p>
      </Callout>

      <VideoSlot
        title="Settings overview"
        description="Tour the settings pages and see what can be configured."
      />

      <h2>Settings Sections</h2>
      <p>
        The settings area is organized into several focused sections:
      </p>
      <ul>
        <li>
          <strong>Field Configuration</strong> — enable, disable, and rename fields across
          orders, proposals, and customers.
        </li>
        <li>
          <strong>Filter Presets</strong> — create and manage saved filter combinations that
          the entire team can use.
        </li>
        <li>
          <strong>Shipping Addresses</strong> — manage the ship-from addresses used when
          generating shipping labels.
        </li>
        <li>
          <strong>User Management</strong> — create new users, assign roles, and activate
          or deactivate accounts.
        </li>
      </ul>
      <p>
        Each section is accessible from the settings sidebar. Changes take effect immediately
        after saving and apply across the entire platform for all users.
      </p>

      <Callout type="info">
        <p>
          Settings changes are not versioned. If you need to revert a change, you will need to
          manually restore the previous configuration.
        </p>
      </Callout>
    </Article>
  )
}
