package com.finnyboyfab.store.catalog;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final List<Product> products = List.of(
            new Product(
                    "board-walnut-end-grain",
                    "generic-end-grain-cutting-board",
                    "End Grain Cutting Board",
                    "A thick everyday workhorse with a refined kitchen profile.",
                    "Built to endure. Always finished with food-grade virgin coconut oil and beeswax.",
                    "End-grain cutting boards are gentle on your knives, gold standard for edge retention and durability. Their self-healing surface hides scratches from heavy knife use, making them the perfect choice for serious home chefs.",
                    "/images/products/end-grain-cutting-board/walnut-end-grain.png",
                    productImages("end-grain-cutting-board"),
                    "Maple, cherry, or walnut",
                    List.of("Maple", "Cherry", "Walnut"),
                    "18 in x 12 in x 1.75 in",
                    22500,
                    Map.of("Maple", 22500, "Cherry", 22500, "Walnut", 27500),
                    8,
                    true,
                    List.of("End-grain construction", "Choose maple, cherry, or walnut", "Soft beveled edges",
                            "Food-safe oil and wax finish")),
            new Product(
                    "board-maple-walnut-server",
                    "maple-walnut-serving-board",
                    "Live Edge Maple Serving Board",
                    "A long striped board for bread, cheese, and table service.",
                    "Ambrosia maple give this serving board a beautiful, unique, pattern without feeling busy. The natural pattern insures that every board is one of a kind and will never be repeated.",
                    "Sized for gatherings and weeknight dinners alike, with a comfortable rounded handle and hanging hole.",
                    "/images/products/maple-walnut-serving-board/maple-walnut-server.png",
                    productImages("maple-walnut-serving-board"),
                    "Hard ambrosia maple",
                    List.of(),
                    "26 in x 7 in x 0.875 in",
                    12800,
                    Map.of(),
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
                    "/images/products/round-cherry-charcuterie-board/cherry-round-board.png",
                    productImages("round-cherry-charcuterie-board"),
                    "Cherry",
                    List.of(),
                    "16 in diameter x 1 in",
                    14200,
                    Map.of(),
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

    private static List<String> productImages(String folderName) {
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath:/static/images/products/" + folderName + "/*");

            return Arrays.stream(resources)
                    .filter(Resource::isReadable)
                    .map(ProductRepository::filename)
                    .filter(ProductRepository::isImage)
                    .sorted(Comparator.comparingInt(ProductRepository::gallerySortOrder)
                            .thenComparing(Comparator.naturalOrder()))
                    .map(filename -> "/images/products/" + folderName + "/" + filename)
                    .toList();
        } catch (FileNotFoundException exception) {
            return List.of();
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private static String filename(Resource resource) {
        return resource.getFilename() == null ? "" : resource.getFilename();
    }

    private static boolean isImage(String filename) {
        String normalizedFilename = filename.toLowerCase();
        return normalizedFilename.endsWith(".jpg")
                || normalizedFilename.endsWith(".jpeg")
                || normalizedFilename.endsWith(".png")
                || normalizedFilename.endsWith(".webp");
    }

    private static int gallerySortOrder(String filename) {
        return switch (filename) {
            case "walnut-end-grain.png" -> 0;
            case "walnut-endgrain-2.png" -> 1;
            case "walnut-end-grain-3.png" -> 2;
            default -> 100;
        };
    }
}
