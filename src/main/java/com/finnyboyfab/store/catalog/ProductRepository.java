package com.finnyboyfab.store.catalog;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final List<Product> products = List.of(
            new Product(
                    "board-walnut-end-grain",
                    "generic-end-grain-cutting-board",
                    "End Grain Cutting Board",
                    "A thick everyday workhorse with a refined kitchen profile.",
                    "Built to endure. Always finished with food-grade coconut oil and beeswax.",
                    "End-grain cutting boards are gentle on your knives, gold standard for edge retention and durability. Their self-healing surface hides scratches from heavy knife use, making them the perfect choice for serious home chefs.",
                    "/images/walnut-end-grain.png",
                    "Maple, cherry, or walnut",
                    List.of("Maple", "Cherry", "Walnut"),
                    "18 in x 13 in x 1.75 in",
                    18500,
                    8,
                    true,
                    List.of("End-grain construction", "Choose maple, cherry, or walnut", "Soft beveled edges",
                            "Food-safe oil and wax finish")),
            new Product(
                    "board-maple-walnut-server",
                    "maple-walnut-serving-board",
                    "Maple & Walnut Serving Board",
                    "A long striped board for bread, cheese, and table service.",
                    "Alternating maple and walnut strips give this serving board a crisp, modern rhythm without feeling busy.",
                    "Sized for gatherings and weeknight dinners alike, with a comfortable rounded handle and hanging hole.",
                    "/images/maple-walnut-server.png",
                    "Hard maple and walnut",
                    List.of(),
                    "26 in x 7 in x 0.875 in",
                    12800,
                    12,
                    true,
                    List.of("Long paddle profile", "Rounded handle", "Hanging hole", "Satin hand-rubbed finish")),
            new Product(
                    "board-cherry-round",
                    "round-cherry-charcuterie-board",
                    "Round Cherry Charcuterie Board",
                    "A warm, circular serving board with a routed juice groove.",
                    "Cherry develops a richer tone over time, making each board more personal the longer it lives in your kitchen.",
                    "A versatile round board for charcuterie, fruit, pastry, or countertop display.",
                    "/images/cherry-round-board.png",
                    "Cherry",
                    List.of(),
                    "16 in diameter x 1 in",
                    14200,
                    10,
                    false,
                    List.of("Routed perimeter groove", "Smooth roundover edge", "Food-safe oil and wax finish",
                            "Made for serving and light prep")));

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
