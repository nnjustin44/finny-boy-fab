package com.finnyboyfab.store.checkout;

import java.util.Map;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;

/** Narrow boundary for deterministic tests without contacting Stripe. */
public interface StripeGateway {
    Session create(Map<String, Object> params, String idempotencyKey) throws StripeException;
    Session retrieve(String sessionId) throws StripeException;
    Session expire(String sessionId) throws StripeException;
}
