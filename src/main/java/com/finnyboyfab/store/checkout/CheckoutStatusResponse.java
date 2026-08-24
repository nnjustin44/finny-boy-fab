package com.finnyboyfab.store.checkout;

public record CheckoutStatusResponse(
        String sessionId,
        String status,
        String paymentStatus
) {
}
