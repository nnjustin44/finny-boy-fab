package com.finnyboyfab.store.cart;

import com.finnyboyfab.store.catalog.Product;

public record CartLineResponse(
        Product product,
        int quantity,
        int lineTotalCents
) {
}
