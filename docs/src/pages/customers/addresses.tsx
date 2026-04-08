import { Article } from '@/components/article'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function AddressesAndContacts() {
  return (
    <Article
      title="Addresses & Contacts"
      subtitle="View all shipping addresses and contact people for a customer."
    >
      <p>
        Customers with multiple addresses or multiple contacts will see all of
        them listed here. If a customer ships to several locations or has
        different contacts for billing, purchasing, and operations, everything is
        visible in one view.
      </p>

      <VideoSlot
        title="Customer addresses and contacts"
        description="See how to view and work with multiple addresses and contacts."
      />

      <Callout type="info">
        Address and contact data is synced from EBMS. To add or update addresses
        and contacts, make the changes in your EBMS desktop application and
        they'll appear here automatically.
      </Callout>
    </Article>
  )
}
