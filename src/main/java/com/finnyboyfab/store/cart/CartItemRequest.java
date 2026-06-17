package com.finnyboyfab.store.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CartItemRequest(
        @NotBlank String productId,
        @Min(1) @Max(99) int quantity
) {
}
