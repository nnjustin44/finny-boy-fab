package com.finnyboyfab.store.catalog;

import java.util.List;

public record Product(
        String id,
        String slug,
        String name,
        String subtitle,
        String description,
        String story,
        String imageUrl,
        String wood,
        List<String> woodOptions,
        String dimensions,
        int priceCents,
        int inventory,
        boolean featured,
        List<String> details
) {
}
