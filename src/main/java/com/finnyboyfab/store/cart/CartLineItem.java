package com.finnyboyfab.store.cart;

public record CartLineItem(
        String id,
        String productId,
        int quantity,
        String selectedWood,
        boolean rubberFeet,
        boolean bronzeRubberFeet
) {
    CartLineItem withQuantity(int nextQuantity) {
        return new CartLineItem(id, productId, nextQuantity, selectedWood, rubberFeet, bronzeRubberFeet);
    }
}
