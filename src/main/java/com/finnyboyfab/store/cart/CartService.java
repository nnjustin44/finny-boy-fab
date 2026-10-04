package com.finnyboyfab.store.cart;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.finnyboyfab.store.catalog.Product;
import com.finnyboyfab.store.catalog.ProductRepository;
import com.finnyboyfab.store.persistence.LocalStore;
import com.finnyboyfab.store.persistence.StoreState;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.CONFLICT;

@Service
public class CartService {

    private static final int FREE_SHIPPING_THRESHOLD_CENTS = 15000;
    private static final int FLAT_SHIPPING_CENTS = 1200;
    private static final int RUBBER_FEET_CENTS = 1000;
    private static final int BRONZE_RUBBER_FEET_CENTS = 2000;

    private final ProductRepository productRepository;
    private final LocalStore store;

    public CartService(ProductRepository productRepository, LocalStore store) {
        this.productRepository = productRepository;
        this.store = store;
    }

    public CartResponse createCart() {
        String cartId = UUID.randomUUID().toString();
        return store.change(state -> {
            state.carts.put(cartId, new StoreState.Cart(Map.of(), System.currentTimeMillis(), false, null));
            return toResponse(cartId, Map.of());
        });
    }

    public CartResponse getCart(String cartId) {
        return store.read(state -> toResponse(cartId, ensureCart(state, cartId).lines()));
    }

    public CartResponse addItem(String cartId, CartItemRequest request) {
        return mutate(cartId, cart -> {
        if (request.quantity() < 1 || request.quantity() > 99) throw new ResponseStatusException(BAD_REQUEST, "Quantity must be between 1 and 99");
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        CartLineItem requestedLine = toLineItem(product, request);
        CartLineItem existingLine = cart.get(requestedLine.id());
        int existingQuantity = existingLine == null ? 0 : existingLine.quantity();
        int nextQuantity = existingQuantity + request.quantity();
        requireProductLimit(cart, product, requestedLine.id(), nextQuantity);
        cart.put(requestedLine.id(), requestedLine.withQuantity(nextQuantity));
        return cart;
        });
    }

    public CartResponse updateItem(String cartId, String lineId, int quantity) {
        return mutate(cartId, cart -> {
        if (quantity < 0 || quantity > 99) throw new ResponseStatusException(BAD_REQUEST, "Quantity must be between 0 and 99");
        if (quantity <= 0) {
            cart.remove(lineId);
            return cart;
        }

        CartLineItem line = cart.get(lineId);
        if (line == null) {
            throw new ResponseStatusException(NOT_FOUND, "Cart line not found");
        }
        Product product = productRepository.findById(line.productId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
        requireProductLimit(cart, product, lineId, quantity);
        cart.put(lineId, line.withQuantity(quantity));
        return cart;
        });
    }

    public CartResponse removeItem(String cartId, String lineId) {
        return mutate(cartId, cart -> { cart.remove(lineId); return cart; });
    }

    public CartResponse prepareCheckout(String cartId, boolean termsAcknowledged) {
        if (!termsAcknowledged) {
            throw new ResponseStatusException(BAD_REQUEST, "Order terms must be acknowledged");
        }
        CartResponse cart = getCart(cartId);
        if (cart.items().isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Cart must contain at least one item");
        }
        return cart;
    }

    private StoreState.Cart ensureCart(StoreState state, String cartId) {
        StoreState.Cart cart = state.carts.get(cartId);
        if (cart == null || store.expired(cart)) {
            throw new ResponseStatusException(NOT_FOUND, "Cart not found or expired");
        }
        return cart;
    }

    private CartResponse mutate(String cartId, Function<Map<String, CartLineItem>, Map<String, CartLineItem>> action) {
        return store.change(state -> {
            StoreState.Cart existing = ensureCart(state, cartId);
            if (existing.paid()) throw new ResponseStatusException(CONFLICT, "This cart has already been paid. Start a new cart for a new order.");
            Map<String, CartLineItem> lines = action.apply(new LinkedHashMap<>(existing.lines()));
            if (lines.size() > 50) throw new ResponseStatusException(BAD_REQUEST, "A cart can contain at most 50 selections");
            state.carts.put(cartId, new StoreState.Cart(lines, System.currentTimeMillis(), false, existing.attempt()));
            return toResponse(cartId, lines);
        });
    }

    // This is a per-order cap, not a cross-customer reservation or stock counter.
    private void requireProductLimit(Map<String, CartLineItem> cart, Product product, String lineId, int quantity) {
        int others = cart.values().stream().filter(line -> line.productId().equals(product.id()) && !line.id().equals(lineId))
                .mapToInt(CartLineItem::quantity).sum();
        if (quantity + others > product.inventory()) {
            throw new ResponseStatusException(BAD_REQUEST, "Per-order limit for this product is " + product.inventory() + " across all options");
        }
    }

    private CartLineItem toLineItem(Product product, CartItemRequest request) {
        if (request.rubberFeet() && request.bronzeRubberFeet()) {
            throw new ResponseStatusException(BAD_REQUEST, "Choose either rubber feet or bronze rubber feet");
        }

        String selectedWood = selectedWood(product, request.selectedWood());
        String baseId = product.id() + ":" + selectedWood.toLowerCase();

        String lineId = baseId;
        if (request.rubberFeet()) {
            lineId += ":rubber-feet";
        }
        if (request.bronzeRubberFeet()) {
            lineId += ":bronze-rubber-feet";
        }
        if (!request.rubberFeet() && !request.bronzeRubberFeet()) {
            lineId += ":standard";
        }

        return new CartLineItem(
                lineId,
                product.id(),
                request.quantity(),
                selectedWood,
                request.rubberFeet(),
                request.bronzeRubberFeet());
    }

    private String selectedWood(Product product, String requestedWood) {
        if (product.woodOptions().isEmpty()) {
            return "";
        }

        if (requestedWood == null || requestedWood.isBlank()) {
            return product.woodOptions().get(0);
        }

        return product.woodOptions().stream()
                .filter(option -> option.equalsIgnoreCase(requestedWood.trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Selected wood is not available for this product"));
    }

    private CartResponse toResponse(String cartId, Map<String, CartLineItem> cart) {
        var lines = cart.values().stream()
                .sorted(java.util.Comparator.comparing(CartLineItem::id))
                .flatMap(line -> productRepository.findById(line.productId()).stream()
                        .map(product -> {
                            int addOnCents = addOnPriceCents(line);
                            return new CartLineResponse(
                                    line.id(),
                                    product,
                                    line.quantity(),
                                    line.selectedWood(),
                                    line.rubberFeet(),
                                    line.bronzeRubberFeet(),
                                    addOnCents * line.quantity(),
                                    (product.priceCentsForWood(line.selectedWood()) + addOnCents) * line.quantity()
                            );
                        }))
                .toList();
        int subtotal = lines.stream().mapToInt(CartLineResponse::lineTotalCents).sum();
        int itemCount = lines.stream().mapToInt(CartLineResponse::quantity).sum();
        int shipping = subtotal == 0 || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
        return new CartResponse(cartId, lines, itemCount, subtotal, shipping, subtotal + shipping);
    }

    private int addOnPriceCents(CartLineItem line) {
        int addOnCents = 0;
        if (line.rubberFeet()) {
            addOnCents += RUBBER_FEET_CENTS;
        }
        if (line.bronzeRubberFeet()) {
            addOnCents += BRONZE_RUBBER_FEET_CENTS;
        }
        return addOnCents;
    }
}
