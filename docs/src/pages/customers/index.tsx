import { Article } from '@/components/article'
import { VideoSlot } from '@/components/video-slot'

export function CustomersOverview() {
  return (
    <Article
      title="Customers"
      subtitle="Access your customer information — anytime, anywhere."
    >
      <p>
        EBMS Online gives you full access to your customer information — anytime,
        anywhere. All the important details from EBMS are available at your
        fingertips, so whether you're in the office or on the road, you always
        have what you need.
      </p>

      <VideoSlot
        title="Customer list overview"
        description="Learn how to navigate and interact with the customer list."
      />
    </Article>
  )
}
