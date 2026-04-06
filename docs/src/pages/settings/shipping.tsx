import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ShippingAddresses() {
  return (
    <Article
      title="Shipping Addresses"
      subtitle="Manage the ship-from addresses used when creating pick lists and purchasing labels."
    >
      <h2>Adding Shipping Addresses</h2>
      <p>
        Shipping addresses represent the physical locations your packages ship from. Most
        businesses have one or two warehouse addresses, but you can add as many as needed. These
        addresses are used as the origin when calculating shipping rates and printing labels.
      </p>

      <Steps>
        <Step number={1} title="Open Shipping Addresses settings">
          <p>
            Navigate to Settings and select <strong>Shipping Addresses</strong> from the sidebar.
          </p>
        </Step>
        <Step number={2} title="Add a new address">
          <p>
            Click <strong>Add Address</strong> and fill in the full street address, city, state,
            and ZIP code. Include a label (such as "Main Warehouse" or "West Coast DC") to make
            it easy to identify.
          </p>
        </Step>
        <Step number={3} title="Save">
          <p>
            Click <strong>Save</strong>. The new address is immediately available for selection
            during pick list creation.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Managing shipping addresses"
        description="See how to add, edit, and set a default shipping address."
      />

      <h2>Default Address</h2>
      <p>
        One address can be designated as the default. The default address is automatically
        pre-selected when creating new pick lists, saving time in the shipping workflow. To set
        a default, click the star icon next to the address or use the <strong>Set as
        Default</strong> action in the address row menu.
      </p>

      <Callout type="tip">
        <p>
          If your business ships from a single location, set that address as the default and you
          will never need to select it manually during pick list creation.
        </p>
      </Callout>

      <h2>Usage in Pick List Creation</h2>
      <p>
        When you create a pick list and proceed to the shipping step, the ship-from address
        dropdown is populated from this settings page. The default address is pre-selected, but
        you can switch to any other saved address. The selected origin address directly affects
        the shipping rates returned by carriers since distance and zone are key pricing factors.
      </p>

      <Callout type="info">
        <p>
          Editing an address here does not retroactively update pick lists or labels that have
          already been created. Only future pick lists will use the updated address.
        </p>
      </Callout>
    </Article>
  )
}
