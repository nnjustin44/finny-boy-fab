package com.finnyboyfab.store.checkout;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;

@Service
public class StripeWebhookService {

    private static final String CHECKOUT_COMPLETED = "checkout.session.completed";
    private static final String ASYNC_SUCCEEDED = "checkout.session.async_payment_succeeded";
    private static final String ASYNC_FAILED = "checkout.session.async_payment_failed";

    private final String webhookSecret;
    private final ObjectMapper objectMapper;
    private final CheckoutCompletionService checkoutCompletionService;

    public StripeWebhookService(
            @Value("${stripe.webhook-secret:}") String webhookSecret,
            ObjectMapper objectMapper,
            CheckoutCompletionService checkoutCompletionService
    ) {
        this.webhookSecret = webhookSecret;
        this.objectMapper = objectMapper;
        this.checkoutCompletionService = checkoutCompletionService;
    }

    public void process(String payload, String signature) {
        if (webhookSecret.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe webhook is not configured. Set the STRIPE_WEBHOOK_SECRET environment variable.");
        }
        if (signature == null || signature.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing Stripe-Signature header");
        }

        Event event = constructEvent(payload, signature);
        if (!CHECKOUT_COMPLETED.equals(event.getType()) && !ASYNC_SUCCEEDED.equals(event.getType()) && !ASYNC_FAILED.equals(event.getType())) {
            return;
        }

        JsonNode session = checkoutSessionData(event);
        if (!"checkout.session".equals(textValue(session, "object"))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Event did not contain a Checkout Session");
        }
        String sessionId = textValue(session, "id");
        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checkout Session id is missing");
        }

        String cartId = textValue(session.path("metadata"), "cart_id");
        if (ASYNC_FAILED.equals(event.getType())) {
            checkoutCompletionService.recordFailure(sessionId, cartId);
            return;
        }
        checkoutCompletionService.record(new CompletedCheckout(
                event.getId(),
                sessionId,
                cartId,
                session.path("amount_total").asLong(0L),
                textValue(session, "currency"),
                textValue(session, "payment_status")));
    }

    private Event constructEvent(String payload, String signature) {
        try {
            return Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook", exception);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe webhook", exception);
        }
    }

    private JsonNode checkoutSessionData(Event event) {
        try {
            return objectMapper.readTree(event.getDataObjectDeserializer().getRawJson());
        } catch (JacksonException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Checkout Session data", exception);
        }
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        return value.isString() ? value.stringValue() : null;
    }
}
