import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../lib/cart";
import { formatMoney } from "../../lib/format";
import type { Product } from "../../types/store";
import './ProductCard.css';

export default function ProductCard({ product, headingLevel = 2 }: { product: Product; headingLevel?: 2 | 3 }) {
  const { addItem, loading } = useCart();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-image-link" aria-label={product.name}>
        <img src={product.imageUrl} alt="" loading="lazy" decoding="async" />
      </Link>
      <div className="product-card-body">
        <div>
          <p className="product-meta">{product.wood}</p>
          <Heading>{product.name}</Heading>
          <p>{product.subtitle}</p>
        </div>
        <div className="product-card-footer">
          <strong>{formatMoney(product.priceCents)}</strong>
          <div className="product-actions">
            {product.woodOptions.length === 0 && (
              <button
                className="icon-button product-cart"
                type="button"
                onClick={() => addItem(product.id)}
                disabled={loading}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingBag size={18} aria-hidden="true" />
              </button>
            )}
            <Link className="text-link" to={`/products/${product.slug}`}>
              Details <span className="sr-only">about {product.name}</span><ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
