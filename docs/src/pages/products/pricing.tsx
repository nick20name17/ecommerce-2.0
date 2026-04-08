import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function ProductPricing() {
  return (
    <Article
      title="Pricing"
      subtitle="Understand how customer-specific pricing works in the product catalog."
    >
      <p>
        Users with order-creation permissions can access{' '}
        <strong>customer-specific pricing</strong> — so when building an order,
        the correct price level is automatically applied. Price levels from EBMS
        are visible within the app for users who have access.
      </p>

      <VideoSlot
        title="Product pricing and price levels"
        description="See how customer-specific pricing is applied during order creation."
      />

      <Callout type="info">
        Customer-specific pricing only appears when browsing products in the
        context of an order or proposal. The standalone catalog view shows
        standard list prices.
      </Callout>
    </Article>
  )
}
