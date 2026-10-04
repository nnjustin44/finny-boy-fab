package com.finnyboyfab.store.checkout;

import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import com.finnyboyfab.store.persistence.LocalStore;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.ObjectMapper;
import com.stripe.net.Webhook;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StripeWebhookServiceTests {

    private static final String WEBHOOK_SECRET = "whsec_test_secret";

    private CheckoutCompletionService checkoutCompletionService;
    private StripeWebhookService stripeWebhookService;
    @TempDir Path directory;
    private LocalStore store;

    @BeforeEach
    void setUp() {
        store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 100, 100);
        checkoutCompletionService = new CheckoutCompletionService(store);
        stripeWebhookService = new StripeWebhookService(
                WEBHOOK_SECRET,
                new ObjectMapper(),
                checkoutCompletionService);
    }

    @AfterEach void close() throws Exception { store.close(); }

    @Test
    void verifiesAndRecordsCompletedCheckout() throws Exception {
        String payload = completedCheckoutPayload("evt_completed", "cs_test_completed", "paid");

        stripeWebhookService.process(payload, signatureFor(payload));

        CompletedCheckout completedCheckout = checkoutCompletionService
                .findBySessionId("cs_test_completed")
                .orElseThrow();
        assertThat(completedCheckout.eventId()).isEqualTo("evt_completed");
        assertThat(completedCheckout.cartId()).isEqualTo("cart_123");
        assertThat(completedCheckout.amountTotal()).isEqualTo(15900L);
        assertThat(completedCheckout.currency()).isEqualTo("usd");
        assertThat(completedCheckout.paymentStatus()).isEqualTo("paid");
    }

    @Test
    void recordsDuplicateSessionOnlyOnce() throws Exception {
        String firstPayload = completedCheckoutPayload("evt_first", "cs_test_duplicate", "paid");
        String retryPayload = completedCheckoutPayload("evt_retry", "cs_test_duplicate", "paid");

        stripeWebhookService.process(firstPayload, signatureFor(firstPayload));
        stripeWebhookService.process(retryPayload, signatureFor(retryPayload));

        assertThat(checkoutCompletionService.findBySessionId("cs_test_duplicate"))
                .get()
                .extracting(CompletedCheckout::eventId)
                .isEqualTo("evt_first");
    }

    @Test
    void doesNotRecordIncompletePayment() throws Exception {
        String payload = completedCheckoutPayload("evt_unpaid", "cs_test_unpaid", "unpaid");

        stripeWebhookService.process(payload, signatureFor(payload));

        assertThat(checkoutCompletionService.findBySessionId("cs_test_unpaid")).isEmpty();
    }

    @Test
    void ignoresOtherVerifiedEventTypes() throws Exception {
        String payload = eventPayload("evt_customer", "customer.created", "customer", "cus_123");

        stripeWebhookService.process(payload, signatureFor(payload));

        assertThat(checkoutCompletionService.findBySessionId("cus_123")).isEmpty();
    }

    @Test void recordsDelayedSuccessAfterUnpaidCompletionAndKeepsItAcrossRestart() throws Exception {
        String unpaid = completedCheckoutPayload("evt_pending", "cs_async", "unpaid");
        stripeWebhookService.process(unpaid, signatureFor(unpaid));
        String paid = completedCheckoutPayload("evt_success", "cs_async", "paid")
                .replace("checkout.session.completed", "checkout.session.async_payment_succeeded");
        stripeWebhookService.process(paid, signatureFor(paid));
        store.close();
        store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 100, 100);
        checkoutCompletionService = new CheckoutCompletionService(store);
        stripeWebhookService = new StripeWebhookService(WEBHOOK_SECRET, new ObjectMapper(), checkoutCompletionService);
        stripeWebhookService.process(paid, signatureFor(paid));
        assertThat(checkoutCompletionService.findBySessionId("cs_async")).get().extracting(CompletedCheckout::eventId).isEqualTo("evt_success");
    }

    @Test void delayedFailureDoesNotEraseAlreadyConfirmedPayment() throws Exception {
        String paid = completedCheckoutPayload("evt_paid", "cs_async", "paid");
        stripeWebhookService.process(paid, signatureFor(paid));
        String failed = completedCheckoutPayload("evt_failed", "cs_async", "unpaid")
                .replace("checkout.session.completed", "checkout.session.async_payment_failed");
        stripeWebhookService.process(failed, signatureFor(failed));
        assertThat(checkoutCompletionService.findBySessionId("cs_async")).get().extracting(CompletedCheckout::paymentStatus).isEqualTo("paid");
    }

    @Test
    void rejectsInvalidSignature() {
        String payload = completedCheckoutPayload("evt_bad", "cs_test_bad", "paid");

        assertThatThrownBy(() -> stripeWebhookService.process(payload, "invalid"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void rejectsRequestsWhenWebhookSecretIsMissing() {
        StripeWebhookService unconfiguredService =
                new StripeWebhookService("", new ObjectMapper(), checkoutCompletionService);

        assertThatThrownBy(() -> unconfiguredService.process("{}", "signature"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }

    private String completedCheckoutPayload(String eventId, String sessionId, String paymentStatus) {
        return """
                {
                  "id": "%s",
                  "object": "event",
                  "api_version": "%s",
                  "created": 1760000000,
                  "type": "checkout.session.completed",
                  "data": {
                    "object": {
                      "id": "%s",
                      "object": "checkout.session",
                      "amount_total": 15900,
                      "currency": "usd",
                      "payment_status": "%s",
                      "status": "complete",
                      "metadata": {"cart_id": "cart_123"}
                    }
                  },
                  "livemode": false,
                  "pending_webhooks": 1
                }
                """.formatted(eventId, "2020-08-27", sessionId, paymentStatus);
    }

    private String eventPayload(String eventId, String eventType, String objectType, String objectId) {
        return """
                {
                  "id": "%s",
                  "object": "event",
                  "api_version": "%s",
                  "created": 1760000000,
                  "type": "%s",
                  "data": {"object": {"id": "%s", "object": "%s"}},
                  "livemode": false,
                  "pending_webhooks": 1
                }
                """.formatted(eventId, "2020-08-27", eventType, objectId, objectType);
    }

    private String signatureFor(String payload) throws NoSuchAlgorithmException, InvalidKeyException {
        long timestamp = Webhook.Util.getTimeNow();
        String signature = Webhook.Util.computeHmacSha256(
                WEBHOOK_SECRET,
                timestamp + "." + payload);
        return "t=" + timestamp + ",v1=" + signature;
    }
}
