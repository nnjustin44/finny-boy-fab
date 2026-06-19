import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductGrid from "../../components/ProductGrid";
import { getProducts } from "../../lib/api";
import type { Product } from "../../types/store";
import './Shop.css';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wood, setWood] = useState("All");

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const woods = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.wood)))], [products]);
  const filtered = wood === "All" ? products : products.filter((product) => product.wood === wood);

  return (
    <section className="section page-section">
      <div className="shop-heading">
        <div>
          <p className="eyebrow">Shop</p>
          <h1>Cutting boards and serving boards</h1>
          <p>
            A concise MVP catalog with individual product pages, live inventory notes,
            and cart actions wired to the Java backend.
          </p>
        </div>
        <div className="filter-control" aria-label="Filter products by wood">
          <SlidersHorizontal size={17} />
          <select value={wood} onChange={(event) => setWood(event.target.value)}>
            {woods.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <ProductGrid products={filtered} />
    </section>
  );
}
