package com.finnyboyfab.store.checkout;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import com.finnyboyfab.store.cart.CartItemRequest;
import com.finnyboyfab.store.cart.CartService;
import com.finnyboyfab.store.catalog.ProductRepository;
import com.finnyboyfab.store.persistence.LocalStore;
import com.finnyboyfab.store.persistence.StoreState;
import com.stripe.exception.ApiConnectionException;
import com.stripe.model.checkout.Session;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class StripeCheckoutServiceTests {
    @TempDir Path directory;
    private LocalStore store;
    private CartService carts;
    private StripeCheckoutService checkout;
    private StripeGateway stripe;
    private String cartId;

    @BeforeEach void setup() {
        stripe = mock(StripeGateway.class);
        openStore();
        cartId = carts.createCart().id();
        carts.addItem(cartId, new CartItemRequest("board-walnut-end-grain", 1, "Maple", false, false));
    }

    private void openStore() {
        store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 100, 100);
        carts = new CartService(new ProductRepository(), store);
        checkout = new StripeCheckoutService(stripe, "https://shop.example", true, store, carts, new CheckoutCompletionService(store));
    }

    @AfterEach void close() throws Exception { store.close(); }

    private Session session(String id, String status, String payment) {
        Session session = new Session();
        session.setId(id); session.setStatus(status); session.setPaymentStatus(payment);
        session.setUrl("https://checkout.stripe.com/" + id);
        session.setMetadata(Map.of("cart_id", cartId));
        return session;
    }

    @Test void reusesOpenSessionAcrossConcurrentCalls() throws Exception {
        Session open = session("cs_one", "open", "unpaid");
        when(stripe.create(anyMap(), anyString())).thenReturn(open);
        when(stripe.retrieve("cs_one")).thenReturn(open);
        var executor = Executors.newFixedThreadPool(4);
        try {
            Callable<String> request = () -> checkout.createSession(cartId, true).sessionId();
            for (var result : executor.invokeAll(List.of(request, request, request, request))) assertThat(result.get()).isEqualTo("cs_one");
        } finally { executor.shutdownNow(); }
        verify(stripe, times(1)).create(anyMap(), anyString());
    }

    @Test void retriesUncertainCreationWithSameKeyAndParametersAcrossRestart() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenThrow(new ApiConnectionException("response lost"))
                .thenReturn(session("cs_recovered", "open", "unpaid"));
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).isInstanceOf(ResponseStatusException.class);
        store.close(); openStore();
        assertThat(checkout.createSession(cartId, true).sessionId()).isEqualTo("cs_recovered");
        ArgumentCaptor<String> keys = ArgumentCaptor.forClass(String.class);
        @SuppressWarnings("unchecked") ArgumentCaptor<Map<String, Object>> params = ArgumentCaptor.forClass(Map.class);
        verify(stripe, times(2)).create(params.capture(), keys.capture());
        assertThat(keys.getAllValues().get(0)).isEqualTo(keys.getAllValues().get(1));
        ObjectMapper mapper = new ObjectMapper();
        assertThat(mapper.readTree(mapper.writeValueAsBytes(params.getAllValues().get(0))))
                .isEqualTo(mapper.readTree(mapper.writeValueAsBytes(params.getAllValues().get(1))));
    }

    @Test void changedCartExpiresOldSessionBeforeCreatingReplacement() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenReturn(session("cs_old", "open", "unpaid"), session("cs_new", "open", "unpaid"));
        when(stripe.retrieve("cs_old")).thenReturn(session("cs_old", "open", "unpaid"));
        when(stripe.expire("cs_old")).thenReturn(session("cs_old", "expired", "unpaid"));
        checkout.createSession(cartId, true);
        carts.addItem(cartId, new CartItemRequest("board-walnut-end-grain", 1, "Maple", false, false));
        assertThat(checkout.createSession(cartId, true).sessionId()).isEqualTo("cs_new");
        var ordered = inOrder(stripe);
        ordered.verify(stripe).create(anyMap(), anyString());
        ordered.verify(stripe).retrieve("cs_old");
        ordered.verify(stripe).expire("cs_old");
        ordered.verify(stripe).create(anyMap(), anyString());
    }

    @Test void expirationRaceNeverCreatesSecondPayableSession() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenReturn(session("cs_old", "open", "unpaid"));
        when(stripe.retrieve("cs_old")).thenReturn(session("cs_old", "open", "unpaid"));
        when(stripe.expire("cs_old")).thenThrow(new ApiConnectionException("ambiguous expiration"));
        checkout.createSession(cartId, true);
        carts.addItem(cartId, new CartItemRequest("board-walnut-end-grain", 1, "Maple", false, false));
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).isInstanceOf(ResponseStatusException.class);
        verify(stripe, times(1)).create(anyMap(), anyString());
    }

    @Test void paidCartCannotPayAgainEvenWhenWebhookWasMissed() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenReturn(session("cs_paid", "open", "unpaid"));
        when(stripe.retrieve("cs_paid")).thenReturn(session("cs_paid", "complete", "paid"));
        checkout.createSession(cartId, true);
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).hasMessageContaining("already been paid");
        assertThatThrownBy(() -> carts.removeItem(cartId, "anything")).hasMessageContaining("already been paid");
        store.close(); openStore();
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).hasMessageContaining("already been paid");
        verify(stripe, times(1)).create(anyMap(), anyString());
    }

    @Test void pendingPaymentNeverCreatesSecondSession() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenReturn(session("cs_pending", "open", "unpaid"));
        when(stripe.retrieve("cs_pending")).thenReturn(session("cs_pending", "complete", "unpaid"));
        checkout.createSession(cartId, true);
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).hasMessageContaining("still being confirmed");
        verify(stripe, times(1)).create(anyMap(), anyString());
    }

    @Test void uncertainCreationBeyondIdempotencyWindowRequiresReconciliation() throws Exception {
        when(stripe.create(anyMap(), anyString())).thenThrow(new ApiConnectionException("lost"));
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).isInstanceOf(ResponseStatusException.class);
        store.change(state -> {
            StoreState.Cart cart = state.carts.get(cartId);
            StoreState.Attempt a = cart.attempt();
            state.carts.put(cartId, cart.withAttempt(new StoreState.Attempt(a.key(), a.fingerprint(), 0, a.params(), null, "creating", "unpaid")));
            return null;
        });
        assertThatThrownBy(() -> checkout.createSession(cartId, true)).hasMessageContaining("Contact support");
        verify(stripe, times(1)).create(anyMap(), anyString());
    }

    @Test void usesAutomaticTaxNativeShippingAndCardOnlyWithVisibleSelections() {
        var params = checkout.parameters(carts.getCart(cartId), System.currentTimeMillis());
        assertThat(params.getAutomaticTax().getEnabled()).isTrue();
        assertThat(params.getAllowedPaymentMethodTypes()).extracting(Object::toString).containsExactly("CARD");
        assertThat(params.getLineItems()).hasSize(1);
        assertThat(params.getLineItems().get(0).getPriceData().getProductData().getName()).contains("Maple");
        assertThat(params.getLineItems().get(0).getPriceData().getProductData().getTaxCode()).isEqualTo("txcd_99999999");
        assertThat(params.getShippingOptions()).hasSize(1);
        assertThat(params.getShippingOptions().get(0).getShippingRateData().getFixedAmount().getAmount()).isZero();
        assertThat(params.getShippingOptions().get(0).getShippingRateData().getTaxCode()).isEqualTo("txcd_92010001");
        // Raw stored params still serialize to the same Stripe request after restart.
        assertThat(com.stripe.param.checkout.SessionCreateParams.builder().putAllExtraParam(params.toMap()).build().toMap()).isEqualTo(params.toMap());
    }

    @Test void verificationReturnsPaymentAndRecoveryReferences() throws Exception {
        when(stripe.retrieve("cs_paid")).thenReturn(session("cs_paid", "complete", "paid"));
        var status = checkout.getSessionStatus("cs_paid");
        assertThat(status.paymentStatus()).isEqualTo("paid");
        assertThat(status.cartId()).isEqualTo(cartId);
        assertThat(status.sessionId()).isEqualTo("cs_paid");
        assertThat(store.<Boolean>read(state -> state.carts.get(cartId).paid())).isTrue();
    }
}
