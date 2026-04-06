import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ManagingCustomers() {
  return (
    <Article
      title="Managing Customers"
      subtitle="Create, edit, and organize customer accounts."
    >
      <h2>Creating New Customers</h2>
      <p>
        New customers can be created directly from the customer list. Click
        <strong> New Customer</strong> to open the creation form, then fill in the required
        fields: company name, customer ID, and primary contact. Additional fields like phone,
        email, and billing address can be completed at creation time or added later.
      </p>

      <Steps>
        <Step number={1} title="Open the form">
          <p>
            Click <strong>New Customer</strong> from the customer list toolbar.
          </p>
        </Step>
        <Step number={2} title="Fill in customer details">
          <p>
            Enter the company name, customer ID, and any contact information you have available.
          </p>
        </Step>
        <Step number={3} title="Save the customer">
          <p>
            Click <strong>Save</strong>. The new customer appears in the list and is ready for
            order and proposal creation.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Creating and editing customers"
        description="Watch how to add a new customer and update their details."
      />

      <h2>Editing Customer Fields</h2>
      <p>
        Open any customer detail page and click the pencil icon next to a field to edit it
        inline. Changes are saved automatically when you click away or press Enter. Editable
        fields include contact info, addresses, notes, and custom fields configured by your
        admin.
      </p>

      <h2>Assigning Sales Reps</h2>
      <p>
        Each customer can be assigned to one or more sales representatives. Open the customer
        detail page and use the <strong>Assignee</strong> control in the sidebar to add or remove
        reps. Assigned reps can filter the customer list to see only their accounts, and they
        receive notifications for activity on those accounts.
      </p>

      <Callout type="info">
        <p>
          Assignment changes are reflected immediately across all views, including the customer
          list, orders, and proposals.
        </p>
      </Callout>

      <h2>Price Levels</h2>
      <p>
        Price levels determine which pricing tier a customer receives when placing orders. Set
        the price level from the customer detail sidebar. When a product is added to an order or
        proposal for this customer, the system automatically applies the correct price based on
        the customer's assigned level.
      </p>

      <Callout type="tip">
        <p>
          If a customer does not have a price level set, standard list pricing is used by default.
        </p>
      </Callout>
    </Article>
  )
}
