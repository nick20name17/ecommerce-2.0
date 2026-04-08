import { Article } from '@/components/article'
import { VideoSlot } from '@/components/video-slot'

export function CustomerDetails() {
  return (
    <Article
      title="Customer Details"
      subtitle="All of your customer's key EBMS information in one place."
    >
      <p>
        Each customer record surfaces all of their key EBMS information in one
        place — contact info, account details, and any other fields relevant to
        your business. No need to dig through the desktop application when you
        need a quick answer.
      </p>

      <VideoSlot
        title="Customer detail walkthrough"
        description="Tour the customer detail page and its tabs."
      />
    </Article>
  )
}
