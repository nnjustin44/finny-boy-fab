import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { formatMoney } from "../lib/format";

export default function CartPage() {
  const { cart, checkout, removeItem, updateItem, loading } = useCart();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  async function handleCheckout() {
    const response = await checkout();
    setOrderNumber(response.orderNumber);
  }

  if (orderNumber) {
    return (
      <section className="section page-section confirmation">
        <CheckCircle2 size={42} />
        <p className="eyebrow">Order received</p>
        <h1>{orderNumber}</h1>
        <p>
          This MVP captured the order flow. The next production step is connecting Stripe,
          taxes, shipping rates, and persistence.
        </p>
        <Link className="button primary" to="/shop">Keep shopping</Link>
      </section>
    );
  }

  return (
    <section className="section page-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h1>Your boards</h1>
        </div>
        <Link className="text-link" to="/shop">Continue shopping</Link>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="cart-empty-page">
          <p>Your cart is empty.</p>
          <Link className="button primary" to="/shop">Shop cutting boards</Link>
        </div>
      ) : (
        <div className="cart-page-grid">
          <div className="cart-page-lines">
            {cart.items.map((line) => (
              <article className="cart-page-line" key={line.product.id}>
                <img src={line.product.imageUrl} alt={line.product.name} />
                <div>
                  <p className="product-meta">{line.product.wood}</p>
                  <h2>{line.product.name}</h2>
                  <p>{line.product.dimensions}</p>
                  <div className="quantity-row">
                    <button type="button" onClick={() => updateItem(line.product.id, line.quantity - 1)} disabled={loading} aria-label="Decrease quantity">
                      <Minus size={15} />
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateItem(line.product.id, line.quantity + 1)} disabled={loading} aria-label="Increase quantity">
                      <Plus size={15} />
                    </button>
                    <button type="button" className="trash-button" onClick={() => removeItem(line.product.id)} disabled={loading} aria-label="Remove item">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <strong>{formatMoney(line.lineTotalCents)}</strong>
              </article>
            ))}
          </div>

          <aside className="order-summary">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{formatMoney(cart.subtotalCents)}</strong>
            </div>
            <div>
              <span>Estimated shipping</span>
              <strong>{cart.estimatedShippingCents === 0 ? "Free" : formatMoney(cart.estimatedShippingCents)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{formatMoney(cart.totalCents)}</strong>
            </div>
            <button className="button primary full" type="button" onClick={handleCheckout}>
              Place test order
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
