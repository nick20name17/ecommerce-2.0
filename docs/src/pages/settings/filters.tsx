import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function FilterPresets() {
  return (
    <Article
      title="Filter Presets"
      subtitle="Save reusable filter combinations and share them with your team."
    >
      <h2>Creating Filter Presets</h2>
      <p>
        Filter presets save a combination of filter conditions so you can reapply them with a
        single click. Instead of rebuilding the same filter every time you visit a list, create
        a preset and it appears in the filter dropdown for instant access.
      </p>

      <Steps>
        <Step number={1} title="Build your filter">
          <p>
            On any list page (orders, proposals, customers), use the filter bar to add conditions
            until the list shows exactly what you need.
          </p>
        </Step>
        <Step number={2} title="Save as preset">
          <p>
            Click <strong>Save Filter</strong> and give the preset a descriptive name, such as
            "My Open Orders" or "High Priority Tasks."
          </p>
        </Step>
        <Step number={3} title="Access the preset">
          <p>
            The saved preset now appears in the filter dropdown on the relevant list page. Click
            it to apply all conditions instantly.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Creating and using filter presets"
        description="Watch how to save, apply, and manage filter presets."
      />

      <h2>Filter Operators</h2>
      <p>
        Each filter condition uses an operator to define the match logic. Available operators
        depend on the field type:
      </p>
      <ul>
        <li><strong>Equals / Not equals</strong> — exact match for text, numbers, and statuses.</li>
        <li><strong>Contains / Does not contain</strong> — partial text matching.</li>
        <li><strong>Greater than / Less than</strong> — numeric and date comparisons.</li>
        <li><strong>Is empty / Is not empty</strong> — check for missing values.</li>
      </ul>

      <h2>Dynamic Date Variables</h2>
      <p>
        Date filters support special variables that evaluate relative to the current date:
      </p>
      <ul>
        <li><code>$today</code> — resolves to today's date each time the filter runs.</li>
        <li><code>$tomorrow</code> — resolves to tomorrow's date.</li>
        <li><code>$yesterday</code> — resolves to yesterday's date.</li>
      </ul>
      <p>
        These variables make presets like "Orders due today" or "Tasks overdue" stay accurate
        without manual updates.
      </p>

      <Callout type="tip" title="Sharing with your team">
        <p>
          Presets created by admins are shared with all users automatically. Standard users can
          only see their own presets and the shared ones created by admins.
        </p>
      </Callout>
    </Article>
  )
}
