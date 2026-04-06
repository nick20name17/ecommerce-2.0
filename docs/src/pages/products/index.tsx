import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProductsOverview() {
  return (
    <Article
      title="Product Catalog"
      subtitle="Browse, search, and explore your product inventory."
    >
      <h2>Browsing by Category</h2>
      <p>
        The product catalog organizes items into categories that mirror your EBMS inventory
        structure. Use the category tree on the left to drill down into specific groups, or
        expand all categories to browse the full catalog. Selecting a category filters the
        product list to show only items in that group and its sub-categories.
      </p>

      <VideoSlot
        title="Product catalog walkthrough"
        description="See how to navigate the catalog by category and search for products."
      />

      <h2>Searching Products</h2>
      <p>
        The search bar supports multiple lookup methods. You can search by:
      </p>
      <ul>
        <li><strong>Item ID</strong> — the unique product identifier from EBMS.</li>
        <li><strong>UPC</strong> — the barcode number for scanning workflows.</li>
        <li><strong>Description</strong> — partial text matches against the product name.</li>
      </ul>
      <p>
        Results update in real time as you type. Combine search with a category selection to
        narrow results further.
      </p>

      <h2>Product Pricing</h2>
      <p>
        Each product row in the catalog displays its list price. When you are working within an
        order or proposal for a specific customer, the catalog automatically adjusts to show
        customer-specific pricing based on the customer's assigned price level. This ensures
        that the price you see is the price the customer will pay.
      </p>

      <Callout type="info">
        <p>
          Customer-specific pricing only appears when browsing products in the context of an
          order or proposal. The standalone catalog view shows standard list prices.
        </p>
      </Callout>

      <Callout type="tip">
        <p>
          Use the UPC search to quickly add products during order creation if you have a barcode
          scanner connected. The search field accepts scanned input directly.
        </p>
      </Callout>
    </Article>
  )
}
