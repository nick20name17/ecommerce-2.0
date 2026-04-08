import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProductsOverview() {
  return (
    <Article
      title="Products & Catalog"
      subtitle="Browse your EBMS inventory items from any device."
    >
      <p>
        EBMS Online gives users full access to their EBMS inventory items in a
        clean, <strong>read-only</strong> web-based format. Browse your entire
        product catalog from any device, structured the same way you're used to
        in EBMS. All product information is synced from EBMS — edits are made in
        the desktop application.
      </p>

      <VideoSlot
        title="Product catalog walkthrough"
        description="See how to navigate the catalog by category and search for products."
      />

      <h2>Image Sync</h2>
      <p>
        Optionally, an <strong>image sync tool</strong> can be set up on your
        server to pull product images into the catalog — so your team can see
        what they're looking at, not just a part number. This is configured by
        the EBMS Online team during setup.
      </p>

      <Callout type="info">
        All product information is synced from EBMS. To update product details,
        make changes in your EBMS desktop application.
      </Callout>
    </Article>
  )
}
