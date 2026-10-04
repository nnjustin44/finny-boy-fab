package com.finnyboyfab.store.checkout;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.finnyboyfab.store.cart.CartLineResponse;
import com.finnyboyfab.store.cart.CartResponse;
import com.finnyboyfab.store.cart.CartService;
import com.finnyboyfab.store.persistence.LocalStore;
import com.finnyboyfab.store.persistence.StoreState;
import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.net.RequestOptions;
import com.stripe.param.checkout.SessionCreateParams;

@Service
public class StripeCheckoutService {
    private static final String LEGAL_POLICY_VERSION = "2026-10-03";
    private static final String GENERAL_TANGIBLE_GOODS_TAX_CODE = "txcd_99999999";
    private static final long SAFE_RETRY_MILLIS = 23 * 60 * 60 * 1000L;
    private final StripeGateway stripe;
    private final String appBaseUrl;
    private final boolean automaticTax;
    private final LocalStore store;
    private final CartService carts;
    private final CheckoutCompletionService completions;

    @Autowired
    public StripeCheckoutService(@Value("${stripe.secret-key:}") String secretKey,
            @Value("${stripe.app-base-url:http://localhost:8080}") String appBaseUrl,
            @Value("${stripe.automatic-tax-enabled:true}") boolean automaticTax,
            LocalStore store, CartService carts, CheckoutCompletionService completions) {
        this(secretKey.isBlank() ? null : gateway(new StripeClient(secretKey)), appBaseUrl, automaticTax, store, carts, completions);
    }

    StripeCheckoutService(StripeGateway stripe, String appBaseUrl, boolean automaticTax,
            LocalStore store, CartService carts, CheckoutCompletionService completions) {
        this.stripe = stripe;
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
        this.automaticTax = automaticTax;
        this.store = store;
        this.carts = carts;
        this.completions = completions;
    }

    public CheckoutSessionResponse createSession(String cartId, boolean termsAcknowledged) {
        // Network operations share the cart mutation lock: two tabs cannot create competing sessions.
        synchronized (store) {
            CartResponse cart = carts.prepareCheckout(cartId, termsAcknowledged);
            requireConfigured();
            StoreState.Cart saved = store.read(state -> state.carts.get(cartId));
            if (saved.paid()) throw alreadyPaid();
            String fingerprint = fingerprint(cart);
            StoreState.Attempt attempt = saved.attempt();
            try {
                if (attempt != null) {
                    Session existing = attempt.sessionId() == null ? recover(attempt) : stripe.retrieve(attempt.sessionId());
                    remember(cartId, existing);
                    if (paid(existing)) throw alreadyPaid();
                    if ("complete".equals(existing.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Payment is still being confirmed. Check your order status before trying again.");
                    if ("open".equals(existing.getStatus())) {
                        if (fingerprint.equals(attempt.fingerprint())) return response(existing, cartId);
                        // A payment/expiry race is resolved by Stripe; any error stops creation.
                        Session expired = stripe.expire(existing.getId());
                        remember(cartId, expired);
                        if (!"expired".equals(expired.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Previous checkout could not be closed. Check its payment status before trying again.");
                    } else if (!"expired".equals(existing.getStatus())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout state is unknown. Check payment status before trying again.");
                    }
                }
                long now = System.currentTimeMillis();
                StoreState.Attempt next = new StoreState.Attempt(UUID.randomUUID().toString(), fingerprint, now,
                        parameters(cart, now).toMap(), null, "creating", "unpaid");
                store.change(state -> { state.carts.put(cartId, state.carts.get(cartId).withAttempt(next)); return null; });
                Session created = recover(next);
                remember(cartId, created);
                if (paid(created)) throw alreadyPaid();
                return response(created, cartId);
            } catch (StripeException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Stripe could not confirm checkout. Retry to recover the same checkout; do not start another order.", e);
            }
        }
    }

    private Session recover(StoreState.Attempt attempt) throws StripeException {
        if (System.currentTimeMillis() - attempt.createdAt() >= SAFE_RETRY_MILLIS) {
            // Stripe may prune idempotency keys after 24h. Never replay uncertain creation then.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Previous checkout needs payment verification. Contact support with your cart reference before placing another order.");
        }
        return stripe.create(attempt.params(), attempt.key());
    }

    public CheckoutStatusResponse getSessionStatus(String sessionId) {
        if (sessionId == null || !sessionId.matches("cs_[A-Za-z0-9_]{1,240}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid checkout reference");
        }
        synchronized (store) {
            requireConfigured();
            try {
                Session session = stripe.retrieve(sessionId);
                String cartId = session.getMetadata() == null ? null : session.getMetadata().get("cart_id");
                if (cartId != null) remember(cartId, session);
                String paymentStatus = session.getPaymentStatus();
                if (!paid(session) && cartId != null) {
                    StoreState.Cart cart = store.read(state -> state.carts.get(cartId));
                    if (cart != null && cart.attempt() != null && sessionId.equals(cart.attempt().sessionId())
                            && "failed".equals(cart.attempt().paymentStatus())) paymentStatus = "failed";
                }
                return new CheckoutStatusResponse(session.getStatus(), paymentStatus, cartId, session.getId());
            } catch (StripeException e) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify payment. Retry verification before placing another order.", e);
            }
        }
    }

    private void remember(String cartId, Session session) {
        store.change(state -> {
            StoreState.Cart cart = state.carts.get(cartId);
            if (cart != null && cart.attempt() != null && (cart.attempt().sessionId() == null || cart.attempt().sessionId().equals(session.getId()))) {
                String payment = !paid(session) && "failed".equals(cart.attempt().paymentStatus()) ? "failed" : session.getPaymentStatus();
                cart = cart.withAttempt(cart.attempt().withSession(session.getId(), session.getStatus(), payment));
                if (paid(session)) cart = cart.markPaid();
                state.carts.put(cartId, cart);
            }
            return null;
        });
        if (paid(session)) completions.record(new CompletedCheckout("status_reconciliation", session.getId(), cartId,
                session.getAmountTotal() == null ? 0 : session.getAmountTotal(), session.getCurrency(), session.getPaymentStatus()));
    }

    private CheckoutSessionResponse response(Session session, String cartId) {
        if (!"open".equals(session.getStatus()) || session.getUrl() == null || session.getUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Checkout is not open. Check payment status before trying again.");
        }
        return new CheckoutSessionResponse(session.getUrl(), session.getId(), cartId);
    }

    private String fingerprint(CartResponse cart) {
        return cart.items().stream().sorted(java.util.Comparator.comparing(CartLineResponse::id))
                .map(line -> line.id() + "=" + line.quantity() + ":" + line.lineTotalCents())
                .collect(java.util.stream.Collectors.joining("|")) + ";shipping=" + cart.estimatedShippingCents()
                + ";tax=" + automaticTax + ";policy=" + LEGAL_POLICY_VERSION;
    }

    SessionCreateParams parameters(CartResponse cart, long acceptedAt) {
        SessionCreateParams.Builder params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .addAllowedPaymentMethodType(SessionCreateParams.AllowedPaymentMethodType.CARD)
                .setAutomaticTax(SessionCreateParams.AutomaticTax.builder().setEnabled(automaticTax).build())
                .setClientReferenceId(cart.id())
                .putMetadata("cart_id", cart.id())
                .putMetadata("legal_attestation", "accepted")
                .putMetadata("legal_policy_version", LEGAL_POLICY_VERSION)
                .putMetadata("legal_accepted_at", Instant.ofEpochMilli(acceptedAt).toString())
                .setPaymentIntentData(SessionCreateParams.PaymentIntentData.builder().putMetadata("cart_id", cart.id()).build())
                .setSuccessUrl(appBaseUrl + "/checkout/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(appBaseUrl + "/cart")
                .setShippingAddressCollection(SessionCreateParams.ShippingAddressCollection.builder()
                        .addAllowedCountry(SessionCreateParams.ShippingAddressCollection.AllowedCountry.US).build());
        cart.items().stream().sorted(java.util.Comparator.comparing(CartLineResponse::id)).forEach(line -> params.addLineItem(toStripeLineItem(line)));
        params.addShippingOption(SessionCreateParams.ShippingOption.builder()
                .setShippingRateData(SessionCreateParams.ShippingOption.ShippingRateData.builder()
                        .setDisplayName(cart.estimatedShippingCents() == 0 ? "Free shipping" : "Flat-rate shipping")
                        .setType(SessionCreateParams.ShippingOption.ShippingRateData.Type.FIXED_AMOUNT)
                        .setTaxBehavior(SessionCreateParams.ShippingOption.ShippingRateData.TaxBehavior.EXCLUSIVE)
                        .setTaxCode("txcd_92010001")
                        .setFixedAmount(SessionCreateParams.ShippingOption.ShippingRateData.FixedAmount.builder()
                                .setCurrency("usd").setAmount((long) cart.estimatedShippingCents()).build()).build()).build());
        return params.build();
    }

    private SessionCreateParams.LineItem toStripeLineItem(CartLineResponse line) {
        String details = customizationDescription(line);
        return SessionCreateParams.LineItem.builder().setQuantity((long) line.quantity())
                .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency("usd").setUnitAmount((long) line.lineTotalCents() / line.quantity())
                        .setTaxBehavior(SessionCreateParams.LineItem.PriceData.TaxBehavior.EXCLUSIVE)
                        .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                .setName(line.product().name() + (details.isBlank() ? "" : " — " + details))
                                .setDescription(details.isBlank() ? line.product().name() : details)
                                .setTaxCode(GENERAL_TANGIBLE_GOODS_TAX_CODE)
                                .putMetadata("product_id", line.product().id()).putMetadata("selection", line.id()).build()).build()).build();
    }

    private String customizationDescription(CartLineResponse line) {
        List<String> details = new ArrayList<>();
        if (!line.selectedWood().isBlank()) details.add("Wood: " + line.selectedWood());
        if (line.rubberFeet()) details.add("Rubber feet");
        if (line.bronzeRubberFeet()) details.add("Bronze rubber feet");
        return String.join(" | ", details);
    }

    private static boolean paid(Session session) { return "paid".equals(session.getPaymentStatus()) || "no_payment_required".equals(session.getPaymentStatus()); }
    private ResponseStatusException alreadyPaid() { return new ResponseStatusException(HttpStatus.CONFLICT, "This cart has already been paid. Check your order status; do not pay again."); }
    private void requireConfigured() { if (stripe == null) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Checkout is temporarily unavailable"); }

    private static StripeGateway gateway(StripeClient client) {
        return new StripeGateway() {
            private RequestOptions options(String key) { return RequestOptions.builder().setIdempotencyKey(key).setConnectTimeout(5000).setReadTimeout(15000).setMaxNetworkRetries(1).build(); }
            public Session create(Map<String, Object> params, String key) throws StripeException {
                return client.v1().checkout().sessions().create(SessionCreateParams.builder().putAllExtraParam(params).build(), options(key));
            }
            public Session retrieve(String id) throws StripeException { return client.v1().checkout().sessions().retrieve(id, options(null)); }
            public Session expire(String id) throws StripeException { return client.v1().checkout().sessions().expire(id, options("expire-" + id)); }
        };
    }
}
