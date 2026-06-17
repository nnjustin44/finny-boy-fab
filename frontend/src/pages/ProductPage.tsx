import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../lib/api";
import { useCart } from "../lib/cart";
import { formatMoney } from "../lib/format";
import type { Product } from "../types/store";

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem, loading } = useCart();

  useEffect(() => {
    if (slug) {
      getProduct(slug).then(setProduct);
    }
  }, [slug]);

  if (!product) {
    return (
      <section className="section page-section">
        <p className="eyebrow">Loading</p>
        <h1>Preparing product details</h1>
      </section>
    );
  }

  return (
    <section className="section product-detail">
      <Link className="text-link back-link" to="/shop">
        <ArrowLeft size={16} /> Back to shop
      </Link>
      <div className="product-detail-grid">
        <div className="product-detail-image">
          <img src={product.imageUrl} alt={product.name} />
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">{product.wood}</p>
          <h1>{product.name}</h1>
          <p className="product-lede">{product.description}</p>
          <p>{product.story}</p>
          <div className="product-facts">
            <div>
              <span>Dimensions</span>
              <strong>{product.dimensions}</strong>
            </div>
            <div>
              <span>Inventory</span>
              <strong>{product.inventory} ready to ship</strong>
            </div>
          </div>
          <ul className="detail-list">
            {product.details.map((detail) => (
              <li key={detail}>
                <Check size={17} /> {detail}
              </li>
            ))}
          </ul>
          <div className="purchase-row">
            <strong className="product-price">{formatMoney(product.priceCents)}</strong>
            <div className="quantity-stepper" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))} aria-label="Increase quantity">
                <Plus size={16} />
              </button>
            </div>
            <button
              className="button primary"
              type="button"
              disabled={loading}
              onClick={() => addItem(product.id, quantity)}
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
