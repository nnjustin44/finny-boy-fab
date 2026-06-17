package com.finnyboyfab.store.cart;

import java.util.List;

public record CartResponse(
        String id,
        List<CartLineResponse> items,
        int itemCount,
        int subtotalCents,
        int estimatedShippingCents,
        int totalCents
) {
}
