package com.finnyboyfab.store.cart;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Path;
import tools.jackson.databind.ObjectMapper;
import com.finnyboyfab.store.persistence.LocalStore;
import org.springframework.web.server.ResponseStatusException;

import com.finnyboyfab.store.catalog.ProductRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CartServiceTests {

    @TempDir Path directory;
    private LocalStore store;
    private CartService cartService;

    @BeforeEach void setup() {
        store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 100, 100);
        cartService = new CartService(new ProductRepository(), store);
    }
    @AfterEach void close() throws Exception { store.close(); }

    @Test
    void addsRubberFeetAsPaidLineOption() {
        CartResponse cart = cartService.createCart();

        CartResponse updatedCart = cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Walnut", true, false));

        assertThat(updatedCart.items()).hasSize(1);
        CartLineResponse line = updatedCart.items().get(0);
        assertThat(line.id()).isEqualTo("board-walnut-end-grain:walnut:rubber-feet");
        assertThat(line.selectedWood()).isEqualTo("Walnut");
        assertThat(line.rubberFeet()).isTrue();
        assertThat(line.bronzeRubberFeet()).isFalse();
        assertThat(line.addOnTotalCents()).isEqualTo(1000);
        assertThat(line.lineTotalCents()).isEqualTo(28500);
        assertThat(updatedCart.subtotalCents()).isEqualTo(28500);
    }

    @Test
    void addsBronzeRubberFeetAsPaidLineOption() {
        CartResponse cart = cartService.createCart();

        CartResponse updatedCart = cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 2, "Maple", false, true));

        assertThat(updatedCart.items()).hasSize(1);
        CartLineResponse line = updatedCart.items().get(0);
        assertThat(line.id()).isEqualTo("board-walnut-end-grain:maple:bronze-rubber-feet");
        assertThat(line.selectedWood()).isEqualTo("Maple");
        assertThat(line.rubberFeet()).isFalse();
        assertThat(line.bronzeRubberFeet()).isTrue();
        assertThat(line.addOnTotalCents()).isEqualTo(4000);
        assertThat(line.lineTotalCents()).isEqualTo(49000);
        assertThat(updatedCart.subtotalCents()).isEqualTo(49000);
    }

    @Test
    void rejectsBothFeetOptions() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Cherry", true, true)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Choose either rubber feet or bronze rubber feet");
    }

    @Test
    void rejectsUnavailableWoodSelection() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Oak", false, false)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Selected wood is not available for this product");
    }

    @Test
    void rejectsCheckoutWithoutAcknowledgedTerms() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.prepareCheckout(cart.id(), false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Order terms must be acknowledged");
    }

    @Test
    void rejectsCheckoutWithEmptyCart() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.prepareCheckout(cart.id(), true))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Cart must contain at least one item");
    }

    @Test void aggregatesOrderLimitAcrossWoodAndFeetSelections() {
        String id = cartService.createCart().id();
        cartService.addItem(id, new CartItemRequest("board-walnut-end-grain", 8, "Maple", false, false));
        assertThatThrownBy(() -> cartService.addItem(id, new CartItemRequest("board-walnut-end-grain", 1, "Walnut", true, false)))
                .hasMessageContaining("across all options");
        assertThat(cartService.getCart(id).itemCount()).isEqualTo(8);
    }

    @Test void persistsCartAcrossRestartAndSerializesConcurrentUpdates() throws Exception {
        String id = cartService.createCart().id();
        var executor = java.util.concurrent.Executors.newFixedThreadPool(4);
        try {
            var requests = java.util.stream.IntStream.range(0, 8).mapToObj(i -> (java.util.concurrent.Callable<Void>) () -> {
                cartService.addItem(id, new CartItemRequest("board-walnut-end-grain", 1, "Maple", false, false));
                return null;
            }).toList();
            for (var result : executor.invokeAll(requests)) result.get();
        } finally { executor.shutdownNow(); }
        store.close();
        store = new LocalStore(new ObjectMapper(), directory.toString(), 30, 100, 100);
        cartService = new CartService(new ProductRepository(), store);
        assertThat(cartService.getCart(id).itemCount()).isEqualTo(8);
    }

    @Test void expiredCartReturnsNotFoundAndCapacityCanBeRecovered() {
        String id = cartService.createCart().id();
        store.change(state -> { state.carts.put(id, new com.finnyboyfab.store.persistence.StoreState.Cart(java.util.Map.of(), 0, false, null)); return null; });
        assertThatThrownBy(() -> cartService.getCart(id)).isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException)e).getStatusCode().value()).isEqualTo(404));
        String fresh = cartService.createCart().id();
        assertThat(fresh).isNotEqualTo(id);
        assertThat(store.<Boolean>read(state -> state.carts.containsKey(id))).isFalse();
    }
}
