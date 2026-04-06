import { Article } from '@/components/article'
import { Step } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function CreatingOrders() {
  return (
    <Article
      title="Creating Orders"
      subtitle="Use the Order Desk to build and submit orders to EBMS."
    >
      <p>
        The Order Desk is a dedicated page for creating new orders and proposals.
        It provides a guided workflow: select a customer, add products from the
        catalog, configure quantities and pricing, then submit the completed
        order to EBMS. The entire process happens within the browser and the
        result is immediately available in your EBMS system.
      </p>

      <VideoSlot title="Creating an order step by step" />

      <h2>Step-by-step guide</h2>

      <Step number={1} title="Select a customer">
        Click the customer selector at the top of the Order Desk. A searchable
        dropdown appears with all customers synced from EBMS. Type a name or
        account number to filter the list, then click to select. The customer's
        billing and shipping addresses, price level, and salesperson will be
        loaded automatically.
      </Step>

      <Step number={2} title="Review customer details">
        After selecting a customer, their information panel appears on the left
        side. Review the billing address, shipping address, and other account
        details. You can edit certain fields such as the salesperson or price
        level directly from this panel if your configuration allows it.
      </Step>

      <Step number={3} title="Browse the product catalog">
        Click <strong>Add Products</strong> to open the product catalog dialog. Products are
        organized and searchable. Each product shows its description, item code,
        and base price. Click a product to add it to your cart. For configured
        products (items with options like size, color, or material), a
        configuration sheet opens so you can select the appropriate options
        before adding.
      </Step>

      <Step number={4} title="Configure line items">
        Products you add appear in the cart table in the center of the page. For
        each line item you can adjust the quantity, override the unit price, add
        a discount, or edit the description. The line total updates in real time
        as you make changes. To remove an item, click the delete icon on its row.
      </Step>

      <Step number={5} title="Review the order summary">
        The cart summary panel on the right shows the subtotal, tax, and grand
        total. Verify these amounts match expectations before submitting. If your
        project uses tax calculations, tax will be computed based on the
        customer's tax settings in EBMS.
      </Step>

      <Step number={6} title="Add attachments (optional)">
        If you need to include files with the order — such as purchase orders,
        spec sheets, or signed quotes — use the attachments section to upload
        them before submitting.
      </Step>

      <Step number={7} title="Submit the order">
        When everything looks correct, click <strong>Create Order</strong> to
        submit as an invoiced order, or <strong>Create Proposal</strong> to
        submit as a quote. The record is sent to EBMS and will appear in the
        Orders or Proposals list once the sync completes. A success notification
        confirms the submission.
      </Step>

      <Callout type="tip">
        If you are building a quote for a customer who has not committed yet,
        submit as a proposal. Proposals can be converted to orders later without
        re-entering the line items.
      </Callout>

      <Callout type="warning">
        Once submitted, the order is created in EBMS. You cannot undo this
        action from the ecommerce app. If you need to void or modify a submitted
        order, do so in EBMS directly and the changes will sync back.
      </Callout>

      <h2>Simple vs. configured products</h2>

      <p>
        Simple products are added to the cart in one click. Configured products
        require you to select options before they can be added. The product edit
        sheet will open automatically for configured items, showing all available
        options. After selecting your configuration, click <strong>Add to
        Cart</strong> to include the item. You can edit the configuration later
        by clicking the item in the cart.
      </p>

      <h2>Clearing the Order Desk</h2>

      <p>
        To start over, click the clear button in the header. This removes the
        selected customer and all cart items. The Order Desk resets to a blank
        state ready for a new order.
      </p>
    </Article>
  )
}
