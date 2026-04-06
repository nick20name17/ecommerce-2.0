import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProductConfigurations() {
  return (
    <Article
      title="Product Configurations"
      subtitle="Understand multi-unit products, configurable items, and how they affect pricing."
    >
      <h2>Multi-Unit Products</h2>
      <p>
        Many products are available in multiple units of measure. For example, a product might be
        sold as a single unit (EA), a pack of ten (PK10), or a case of forty-eight (CS48). Each
        unit of measure has its own item ID, pricing, and weight. When adding a product to an
        order or proposal, you select the specific unit configuration from a dropdown.
      </p>
      <p>
        The catalog displays all available units for a product, making it easy to compare pricing
        across quantities. Bulk units typically offer a lower per-unit cost, which you can
        highlight to customers during the quoting process.
      </p>

      <VideoSlot
        title="Working with multi-unit products"
        description="See how to select units and understand pricing per configuration."
      />

      <h2>Configurable Products</h2>
      <p>
        Some products support additional configuration options such as size, color, finish, or
        material. These are presented as selectable attributes when you add the product to an
        order. Each combination of attributes may correspond to a distinct SKU with its own
        price and availability.
      </p>

      <Callout type="info">
        <p>
          Configurable product options are defined in your EBMS system and synced automatically.
          The available choices and their associated pricing cannot be edited from the web
          application.
        </p>
      </Callout>

      <h2>How Configurations Affect Pricing</h2>
      <p>
        Pricing is resolved at the configuration level. When you select a specific unit of
        measure or product configuration, the displayed price reflects that exact variant. If
        a customer has a price level assigned, the customer-specific price for that particular
        configuration is shown. This means different units of the same base product can have
        independently negotiated prices per customer.
      </p>

      <Callout type="tip">
        <p>
          When creating proposals, try adding multiple unit configurations of the same product so
          the customer can compare pricing and choose the option that works best for them.
        </p>
      </Callout>
    </Article>
  )
}
