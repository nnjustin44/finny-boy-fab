package com.finnyboyfab.store.checkout;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.finnyboyfab.store.persistence.LocalStore;
import com.finnyboyfab.store.persistence.StoreState;

/** Durable payment coordination, not a fulfillment queue. Fulfill paid orders in Stripe. */
@Service
public class CheckoutCompletionService {
    private static final Logger LOGGER = LoggerFactory.getLogger(CheckoutCompletionService.class);
    private final LocalStore store;

    public CheckoutCompletionService(LocalStore store) { this.store = store; }

    public void record(CompletedCheckout completion) {
        if (!"paid".equals(completion.paymentStatus()) && !"no_payment_required".equals(completion.paymentStatus())) return;
        boolean added = store.change(state -> {
            StoreState.Cart cart = state.carts.get(completion.cartId());
            if (cart != null) {
                if (cart.attempt() != null && (cart.attempt().sessionId() == null || cart.attempt().sessionId().equals(completion.sessionId()))) {
                    cart = cart.withAttempt(cart.attempt().withSession(completion.sessionId(), "complete", completion.paymentStatus()));
                }
                state.carts.put(completion.cartId(), cart.markPaid());
            }
            return state.completions.putIfAbsent(completion.sessionId(), completion) == null;
        });
        if (added) LOGGER.info("Confirmed paid Stripe Checkout Session {} for cart {}; fulfill and track shipment in the manual Stripe workflow", completion.sessionId(), completion.cartId());
    }

    public void recordFailure(String sessionId, String cartId) {
        store.change(state -> {
            StoreState.Cart cart = state.carts.get(cartId);
            if (cart != null && !cart.paid() && cart.attempt() != null && (cart.attempt().sessionId() == null || sessionId.equals(cart.attempt().sessionId()))) {
                state.carts.put(cartId, cart.withAttempt(cart.attempt().withSession(sessionId, "complete", "failed")));
            }
            return null;
        });
        LOGGER.warn("Stripe Checkout Session {} reported delayed payment failure; check Stripe before accepting another payment", sessionId);
    }

    public Optional<CompletedCheckout> findBySessionId(String sessionId) {
        return store.read(state -> Optional.ofNullable(state.completions.get(sessionId)));
    }
}
