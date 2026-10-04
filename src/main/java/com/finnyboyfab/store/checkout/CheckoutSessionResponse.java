package com.finnyboyfab.store.checkout;

public record CheckoutSessionResponse(
        String checkoutUrl,
        String sessionId,
        String cartId
) {
}
