package com.finnyboyfab.store.checkout;

public record CheckoutStatusResponse(
        String status,
        String paymentStatus
) {
}
