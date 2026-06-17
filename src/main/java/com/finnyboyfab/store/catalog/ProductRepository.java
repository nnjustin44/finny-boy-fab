package com.finnyboyfab.store.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final List<Product> products = List.of(
            new Product(
                    "board-walnut-end-grain",
                    "walnut-end-grain-board",
                    "Walnut End-Grain Board",
                    "A thick everyday workhorse with a refined kitchen profile.",
                    "End-grain walnut absorbs knife work beautifully and brings a deep, architectural grain pattern to the counter.",
                    "Built for cooks who want one board to prep, serve, and leave out between meals. Finished with food-safe oil and wax.",
                    "/images/walnut-end-grain.png",
                    "American walnut",
                    "18 in x 13 in x 1.75 in",
                    18500,
                    8,
                    true,
                    List.of("End-grain construction", "Soft beveled edges", "Food-safe oil and wax finish", "Rubber feet available on request")
            ),
            new Product(
                    "board-maple-walnut-server",
                    "maple-walnut-serving-board",
                    "Maple & Walnut Serving Board",
                    "A long striped board for bread, cheese, and table service.",
                    "Alternating maple and walnut strips give this serving board a crisp, modern rhythm without feeling busy.",
                    "Sized for gatherings and weeknight dinners alike, with a comfortable rounded handle and hanging hole.",
                    "/images/maple-walnut-server.png",
                    "Hard maple and walnut",
                    "26 in x 7 in x 0.875 in",
                    12800,
                    12,
                    true,
                    List.of("Long paddle profile", "Rounded handle", "Hanging hole", "Satin hand-rubbed finish")
            ),
            new Product(
                    "board-cherry-round",
                    "round-cherry-charcuterie-board",
                    "Round Cherry Charcuterie Board",
                    "A warm, circular serving board with a routed juice groove.",
                    "Cherry develops a richer tone over time, making each board more personal the longer it lives in your kitchen.",
                    "A versatile round board for charcuterie, fruit, pastry, or countertop display.",
                    "/images/cherry-round-board.png",
                    "Cherry",
                    "16 in diameter x 1 in",
                    14200,
                    10,
                    false,
                    List.of("Routed perimeter groove", "Smooth roundover edge", "Food-safe oil and wax finish", "Made for serving and light prep")
            )
    );

    public List<Product> findAll() {
        return products;
    }

    public Optional<Product> findBySlug(String slug) {
        return products.stream().filter(product -> product.slug().equals(slug)).findFirst();
    }

    public Optional<Product> findById(String id) {
        return products.stream().filter(product -> product.id().equals(id)).findFirst();
    }
}
