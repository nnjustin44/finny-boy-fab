package com.finnyboyfab.store.checkout;

public record CheckoutSessionResponse(
        String sessionId,
        String checkoutUrl
) {
}
