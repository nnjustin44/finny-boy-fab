import ProductCard from "../ProductCard";
import type { Product } from "../../types/store";
import './ProductGrid.css';

export default function ProductGrid({ products, headingLevel = 2 }: { products: Product[]; headingLevel?: 2 | 3 }) {
  return (
    <div className="product-grid" role="list">
      {products.map((product) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} headingLevel={headingLevel} />
        </div>
      ))}
    </div>
  );
}
