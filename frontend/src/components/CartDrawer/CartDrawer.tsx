import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatMoney } from "../../lib/format";
import { useCart } from "../../lib/cart";
import '../../styles/cart.css';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, cartOpen, closeCart, removeItem, updateItem, loading } = useCart();

  return (
    <aside className={cartOpen ? "cart-drawer open" : "cart-drawer"} aria-label="Shopping cart">
      <div className="cart-panel">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Your Cart</p>
            <h2>{cart?.itemCount ?? 0} item{cart?.itemCount === 1 ? "" : "s"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={closeCart} aria-label="Close cart">
            <X size={22} />
          </button>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={36} />
            <p>Your cart is ready for boards.</p>
            <Link className="button primary" to="/shop" onClick={closeCart}>
              Shop boards
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((line) => (
                <article className="cart-line" key={line.id}>
                  <img src={line.product.imageUrl} alt={line.product.name} />
                  <div>
                    <h3>{line.product.name}</h3>
                    <p>{formatMoney(line.lineTotalCents)}</p>
                    {(line.selectedWood || line.rubberFeet || line.initialsEngraving) && (
                      <div className="cart-line-options">
                        {line.selectedWood && <span>Wood: {line.selectedWood}</span>}
                        {line.rubberFeet && <span>Rubber feet +$10</span>}
                        {line.initialsEngraving && <span>Initials: {line.initials}</span>}
                      </div>
                    )}
                    <div className="quantity-row">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.product.name} quantity`}
                        onClick={() => updateItem(line.id, line.quantity - 1)}
                        disabled={loading}
                      >
                        <Minus size={15} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.product.name} quantity`}
                        onClick={() => updateItem(line.id, line.quantity + 1)}
                        disabled={loading}
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        type="button"
                        className="trash-button"
                        aria-label={`Remove ${line.product.name}`}
                        onClick={() => removeItem(line.id)}
                        disabled={loading}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(cart.subtotalCents)}</strong>
              </div>
              <div>
                <span>Estimated shipping</span>
                <strong>
                  {cart.estimatedShippingCents === 0
                    ? "Free"
                    : formatMoney(cart.estimatedShippingCents)}
                </strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatMoney(cart.totalCents)}</strong>
              </div>
              <Link className="button primary full" to="/cart" onClick={closeCart}>
                View cart
              </Link>
            </div>
          </>
        )}
      </div>
      <button className="cart-backdrop" type="button" onClick={closeCart} aria-label="Close cart" />
    </aside>
  );
}
