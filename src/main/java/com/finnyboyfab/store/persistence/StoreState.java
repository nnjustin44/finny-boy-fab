package com.finnyboyfab.store.persistence;

import java.util.LinkedHashMap;
import java.util.Map;
import com.finnyboyfab.store.cart.CartLineItem;
import com.finnyboyfab.store.checkout.CompletedCheckout;

/** Local coordination only. Stripe remains the order and customer-data source of truth. */
public class StoreState {
    public Map<String, Cart> carts = new LinkedHashMap<>();
    public Map<String, CompletedCheckout> completions = new LinkedHashMap<>();

    public StoreState copy() {
        StoreState copy = new StoreState();
        copy.carts.putAll(carts);
        copy.completions.putAll(completions);
        return copy;
    }

    public record Cart(Map<String, CartLineItem> lines, long updatedAt, boolean paid, Attempt attempt) {
        public Cart { lines = Map.copyOf(lines); }
        public Cart withAttempt(Attempt next) { return new Cart(lines, System.currentTimeMillis(), paid, next); }
        public Cart markPaid() { return new Cart(lines, System.currentTimeMillis(), true, attempt); }
    }

    // Store the actual request, not a regenerated request: retries must survive code/config changes.
    public record Attempt(String key, String fingerprint, long createdAt, Map<String, Object> params,
                          String sessionId, String status, String paymentStatus) {
        public Attempt withSession(String id, String state, String payment) {
            return new Attempt(key, fingerprint, createdAt, params, id, state, payment);
        }
    }
}
