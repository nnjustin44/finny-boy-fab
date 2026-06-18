package com.finnyboyfab.store.cart;

import com.finnyboyfab.store.catalog.Product;

public record CartLineResponse(
        String id,
        Product product,
        int quantity,
        String selectedWood,
        boolean rubberFeet,
        boolean initialsEngraving,
        String initials,
        int addOnTotalCents,
        int lineTotalCents
) {
}
