import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { formatMoney } from "../lib/format";
import type { Product } from "../types/store";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, loading } = useCart();

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={product.name}>
        <img src={product.imageUrl} alt={product.name} />
      </Link>
      <div className="product-card-body">
        <div>
          <p className="product-meta">{product.wood}</p>
          <h3>{product.name}</h3>
          <p>{product.subtitle}</p>
        </div>
        <div className="product-card-footer">
          <strong>{formatMoney(product.priceCents)}</strong>
          <div className="product-actions">
            <button
              className="icon-button product-cart"
              type="button"
              onClick={() => addItem(product.id)}
              disabled={loading}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag size={18} />
            </button>
            <Link className="text-link" to={`/products/${product.slug}`}>
              Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
