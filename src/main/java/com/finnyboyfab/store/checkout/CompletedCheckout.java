package com.finnyboyfab.store.checkout;

public record CompletedCheckout(
        String eventId,
        String sessionId,
        String cartId,
        long amountTotal,
        String currency,
        String paymentStatus
) {
}
