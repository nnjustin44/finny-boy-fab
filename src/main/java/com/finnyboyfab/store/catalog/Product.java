package com.finnyboyfab.store.catalog;

import java.util.List;
import java.util.Map;

public record Product(
        String id,
        String slug,
        String name,
        String subtitle,
        String description,
        String story,
        String imageUrl,
        List<String> imageUrls,
        String wood,
        List<String> woodOptions,
        String dimensions,
        int priceCents,
        Map<String, Integer> woodPriceCents,
        int inventory,
        boolean featured,
        List<String> details
) {
    public int priceCentsForWood(String selectedWood) {
        if (selectedWood == null || selectedWood.isBlank()) {
            return priceCents;
        }

        return woodPriceCents.entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(selectedWood.trim()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(priceCents);
    }
}
