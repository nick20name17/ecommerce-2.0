import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function FieldConfiguration() {
  return (
    <Article
      title="Field Configuration"
      subtitle="Control which fields appear across the platform and customize their display names."
    >
      <h2>Enable and Disable Fields</h2>
      <p>
        Not every field is relevant to every business. The field configuration page lets admins
        toggle individual fields on or off for each entity type: orders, proposals, and
        customers. Disabled fields are hidden from list views, detail pages, and filter options
        throughout the application. This keeps the interface clean and focused on the data your
        team actually uses.
      </p>

      <Steps>
        <Step number={1} title="Navigate to Field Configuration">
          <p>
            Open Settings and select <strong>Field Configuration</strong> from the sidebar.
          </p>
        </Step>
        <Step number={2} title="Choose an entity type">
          <p>
            Select the entity tab (Orders, Proposals, or Customers) to see its available fields.
          </p>
        </Step>
        <Step number={3} title="Toggle fields">
          <p>
            Use the toggle switch next to each field to enable or disable it. Changes are saved
            automatically and apply to all users.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Configuring fields"
        description="See how to enable, disable, and rename fields for your team."
      />

      <h2>Field Aliases</h2>
      <p>
        Field aliases let you rename column headers and labels without changing the underlying
        data. For example, if your team calls the "PO Number" field "Reference Number," you can
        set an alias so the new name appears everywhere in the interface. Click the field name
        in the configuration list to edit its alias.
      </p>

      <Callout type="tip">
        <p>
          Use aliases to match the terminology your team already uses. This reduces confusion
          and speeds up onboarding for new users.
        </p>
      </Callout>

      <h2>Editable Fields</h2>
      <p>
        Some fields are marked as editable, meaning users can modify their values directly on
        the detail page. The field configuration page shows which fields support inline editing.
        Non-editable fields are synced from EBMS and can only be changed in the source system.
      </p>

      <Callout type="info">
        <p>
          Disabling a field does not delete its data. Re-enabling a previously disabled field
          restores it with all existing values intact.
        </p>
      </Callout>
    </Article>
  )
}
