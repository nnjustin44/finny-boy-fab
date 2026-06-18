package com.finnyboyfab.store.cart;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @PostMapping
    public CartResponse createCart() {
        return cartService.createCart();
    }

    @GetMapping("/{cartId}")
    public CartResponse getCart(@PathVariable String cartId) {
        return cartService.getCart(cartId);
    }

    @PostMapping("/{cartId}/items")
    public CartResponse addItem(@PathVariable String cartId, @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(cartId, request);
    }

    @PatchMapping("/{cartId}/items/{lineId}")
    public CartResponse updateItem(
            @PathVariable String cartId,
            @PathVariable String lineId,
            @RequestBody @Min(0) @Max(99) Integer quantity
    ) {
        return cartService.updateItem(cartId, lineId, quantity);
    }

    @DeleteMapping("/{cartId}/items/{lineId}")
    public CartResponse removeItem(@PathVariable String cartId, @PathVariable String lineId) {
        return cartService.removeItem(cartId, lineId);
    }

    @PostMapping("/{cartId}/checkout")
    public CheckoutResponse checkout(@PathVariable String cartId) {
        return cartService.checkout(cartId);
    }
}
