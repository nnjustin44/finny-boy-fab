package com.finnyboyfab.store.cart;

public record CheckoutResponse(
        String orderNumber,
        CartResponse cart
) {
}
