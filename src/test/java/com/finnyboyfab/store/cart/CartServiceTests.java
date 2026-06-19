package com.finnyboyfab.store.cart;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.finnyboyfab.store.catalog.ProductRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CartServiceTests {

    private final CartService cartService = new CartService(new ProductRepository());

    @Test
    void addsRubberFeetAsPaidLineOption() {
        CartResponse cart = cartService.createCart();

        CartResponse updatedCart = cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Walnut", true, false, ""));

        assertThat(updatedCart.items()).hasSize(1);
        CartLineResponse line = updatedCart.items().get(0);
        assertThat(line.id()).isEqualTo("board-walnut-end-grain:walnut:rubber-feet");
        assertThat(line.selectedWood()).isEqualTo("Walnut");
        assertThat(line.rubberFeet()).isTrue();
        assertThat(line.initialsEngraving()).isFalse();
        assertThat(line.addOnTotalCents()).isEqualTo(1000);
        assertThat(line.lineTotalCents()).isEqualTo(19500);
        assertThat(updatedCart.subtotalCents()).isEqualTo(19500);
    }

    @Test
    void addsInitialsEngravingWithSanitizedInitials() {
        CartResponse cart = cartService.createCart();

        CartResponse updatedCart = cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 2, "Maple", false, true, " jn7 "));

        assertThat(updatedCart.items()).hasSize(1);
        CartLineResponse line = updatedCart.items().get(0);
        assertThat(line.id()).isEqualTo("board-walnut-end-grain:maple:initials:JN");
        assertThat(line.selectedWood()).isEqualTo("Maple");
        assertThat(line.rubberFeet()).isFalse();
        assertThat(line.initialsEngraving()).isTrue();
        assertThat(line.initials()).isEqualTo("JN");
        assertThat(line.addOnTotalCents()).isEqualTo(2000);
        assertThat(line.lineTotalCents()).isEqualTo(39000);
        assertThat(updatedCart.subtotalCents()).isEqualTo(39000);
    }

    @Test
    void combinesRubberFeetAndInitialsEngraving() {
        CartResponse cart = cartService.createCart();

        CartResponse updatedCart = cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Cherry", true, true, "JN"));

        assertThat(updatedCart.items()).hasSize(1);
        CartLineResponse line = updatedCart.items().get(0);
        assertThat(line.id()).isEqualTo("board-walnut-end-grain:cherry:rubber-feet:initials:JN");
        assertThat(line.rubberFeet()).isTrue();
        assertThat(line.initialsEngraving()).isTrue();
        assertThat(line.initials()).isEqualTo("JN");
        assertThat(line.addOnTotalCents()).isEqualTo(2000);
        assertThat(line.lineTotalCents()).isEqualTo(20500);
    }

    @Test
    void rejectsUnavailableWoodSelection() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.addItem(
                cart.id(),
                new CartItemRequest("board-walnut-end-grain", 1, "Oak", false, false, "")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Selected wood is not available for this product");
    }

    @Test
    void rejectsCheckoutWithoutAcknowledgedTerms() {
        CartResponse cart = cartService.createCart();

        assertThatThrownBy(() -> cartService.checkout(cart.id(), false))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Order terms must be acknowledged");
    }
}
