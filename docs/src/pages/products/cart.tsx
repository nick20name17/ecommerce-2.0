import { Article } from '@/components/article'
import { Step, Steps } from '@/components/step'
import { Callout } from '@/components/callout'
import { VideoSlot } from '@/components/video-slot'

export function CartAndCheckout() {
  return (
    <Article
      title="Cart & Checkout"
      subtitle="Add items, review your cart, and submit as an order or proposal."
    >
      <h2>Adding Items to Cart</h2>
      <p>
        While creating an order or proposal, browse or search the product catalog and click the
        add button next to any product. The item is added to your cart with a default quantity
        of one. You can continue browsing and adding more products without leaving the catalog
        view.
      </p>

      <Steps>
        <Step number={1} title="Search or browse">
          <p>
            Use the search bar or category tree to find the product you need.
          </p>
        </Step>
        <Step number={2} title="Add to cart">
          <p>
            Click the <strong>+</strong> button on the product row. The cart counter in the
            header updates immediately.
          </p>
        </Step>
        <Step number={3} title="Set quantity">
          <p>
            Adjust the quantity directly in the cart panel. Pricing recalculates automatically
            based on the selected unit and quantity.
          </p>
        </Step>
      </Steps>

      <VideoSlot
        title="Cart and checkout flow"
        description="Walk through adding items, editing quantities, and submitting."
      />

      <h2>Editing Quantities</h2>
      <p>
        Open the cart panel to see all added items. Each line shows the product description, unit
        of measure, unit price, and quantity. Click the quantity field to type a new value, or use
        the increment and decrement controls. To remove an item entirely, set its quantity to zero
        or click the remove button.
      </p>

      <h2>Viewing Cart Summary</h2>
      <p>
        The cart summary at the bottom of the panel displays the total number of line items,
        total quantity across all items, and the order subtotal. Review this summary before
        proceeding to make sure everything looks correct.
      </p>

      <h2>Submitting</h2>
      <p>
        When your cart is ready, click <strong>Submit as Order</strong> to create a live order, or
        <strong> Submit as Proposal</strong> to save it as a quote. Both options create the
        record immediately and redirect you to the detail page.
      </p>

      <Callout type="tip">
        <p>
          You can switch between order and proposal submission at the last step. There is no need
          to start over if you change your mind about the record type.
        </p>
      </Callout>
    </Article>
  )
}
