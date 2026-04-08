import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function LineItems() {
  return (
    <Article
      title="Line Items"
      subtitle="Configure the line items view to match your workflow."
    >
      <p>
        The line items view shows every product on an order. Users can configure
        what they see to match the way their team works.
      </p>

      <VideoSlot
        title="Line items configuration"
        description="See how to customize fields and column headers in the line items view."
      />

      <h2>Custom Fields</h2>
      <p>
        Add fields specific to your workflow. Custom fields are configured by an
        admin and appear as additional columns in the line items table. This lets
        each business surface the data that matters most — whether that's lot
        numbers, warehouse locations, or special handling instructions.
      </p>

      <h2>Field Renaming</h2>
      <p>
        Rename column headers to match your team's terminology. If your team
        calls something different than the default label, an admin can update the
        display name so everyone sees language they recognize.
      </p>

      <Callout type="info">
        Line items are fully configurable so each business can tailor the order
        detail view to what matters most to them.
      </Callout>
    </Article>
  )
}
