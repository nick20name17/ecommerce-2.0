import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProductCategories() {
  return (
    <Article
      title="Categories"
      subtitle="Browse products using the same folder structure as your EBMS system."
    >
      <p>
        Products in EBMS Online mirror the folder structure of your EBMS system.
        If you know where to find something in EBMS, you'll find it in the same
        place here.
      </p>

      <VideoSlot
        title="Browsing product categories"
        description="See how the category tree maps to your EBMS inventory structure."
      />

      <Callout type="info">
        Categories are synced from EBMS and reflect your existing inventory
        organization. To reorganize categories, make the changes in your EBMS
        desktop application.
      </Callout>
    </Article>
  )
}
