import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function CustomersOverview() {
  return (
    <Article
      title="Customer List"
      subtitle="Browse, search, and filter your customer database."
    >
      <h2>Browsing Customers</h2>
      <p>
        The customer list is the central hub for managing your entire customer base. Each row
        displays the customer ID, company name, primary contact, assigned sales rep, and account
        status. Click any row to open the full customer detail page.
      </p>

      <VideoSlot
        title="Customer list overview"
        description="Learn how to navigate and interact with the customer list."
      />

      <h2>Search</h2>
      <p>
        Use the search bar at the top of the list to find customers instantly. Search matches
        against customer name, customer ID, phone number, and email address. Results update as
        you type, making it easy to locate a specific account even in large databases.
      </p>

      <h2>Sorting and Filtering</h2>
      <p>
        Click any column header to sort the list in ascending or descending order. For more
        advanced filtering, use the filter bar to build conditions based on fields like status,
        assigned rep, price level, or date created. Filters can be combined and saved as presets
        for reuse.
      </p>

      <Callout type="tip">
        <p>
          Save frequently used filter combinations as presets from the Settings page. Presets
          appear in the filter dropdown for the whole team to use.
        </p>
      </Callout>

      <h2>Customer ID Format</h2>
      <p>
        Every customer has a unique identifier that originates from your EBMS back-office system.
        Customer IDs are alphanumeric and may include hyphens. They are displayed prominently in
        the list and on the detail page, and can be used in the search bar for precise lookups.
      </p>

      <Callout type="info">
        <p>
          Customer IDs are synced from EBMS and cannot be changed within the web application.
          If a customer ID needs to be updated, the change must be made in the source system.
        </p>
      </Callout>
    </Article>
  )
}
